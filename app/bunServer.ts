import { readdir } from "node:fs/promises";

import type LongRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/LongRangeComm";
import { buildDatabase } from "@thorium/.server/init/buildDatabase";
import { loadOrCreateCerts } from "@thorium/.server/init/certs";
import { exitHandler, registerExitFunction } from "@thorium/.server/init/exitHandler";
import { initDefaultPlugin } from "@thorium/.server/init/initDefaultPlugin";
import { createContext, initWebsocket } from "@thorium/.server/init/liveQuery";
import { advertiseMdns } from "@thorium/.server/init/mdns";
import { router } from "@thorium/.server/init/router";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { bunDataStoreProps, setBasePath } from "@thorium/utils/.server/db-fs/bunDataStoreProps";
import { loadPlugins } from "@thorium/utils/.server/db-fs/loadPlugins";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { snapshot } from "@thorium/utils/.server/snapshot";
import { vanity } from "@thorium/utils/.server/vanity";
import { liveQueryPlugin } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import type { ProcedureCallOptions } from "@thorium/utils/live-query/.server/procedure";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { websocket, upgradeWebSocket } from "hono/bun";
import { getCookie, setCookie } from "hono/cookie";
import { getMimeType } from "hono/utils/mime";

import { isObject } from "./typeguards/isObject";

export async function startHttpServer({ isProd, isKiosk }: { isProd: boolean; isKiosk: boolean }) {
	try {
		console.info(`Starting Thorium...`);
		const dataStoreProps = bunDataStoreProps(isProd || isKiosk ? "production" : "development");
		return await DataStore.operations.run(dataStoreProps, async () => {
			const thoriumPath = DataStore.operations.getStore()!.thoriumPath;
			setBasePath(thoriumPath);
			let inited = false;
			try {
				await readdir(thoriumPath);
				inited = true;
			} catch {}

			if (!inited) {
				await initDefaultPlugin();
			}

			const app = new Hono();
			const database = await buildDatabase(loadPlugins);
			const middleware = await liveQueryPlugin({
				createContext,
				initWebsocket,
				router,
				upgradeWebSocket,
				extraContext: database,
				onCall: (opts: ProcedureCallOptions, result: unknown) => {
					const ecs = database?.flight?.ecs;
					if (!ecs || opts.type !== "send") return;
					const rawInputObj = isObject(opts.rawInput) ? opts.rawInput : {};
					void processTriggers(ecs, {
						event: opts.path,
						values: {
							...rawInputObj,
							...(typeof result === "object" && !Array.isArray(result) ? result : {}),
						},
					});
				},
			});

			app.use(middleware);

			app.get(
				"/healthcheck",
				() =>
					new Response("OK", {
						status: 200,
						headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" },
					}),
			);

			app.post("/snapshot", async () => {
				await snapshot(database);
				return new Response("OK", { status: 200 });
			});

			app.use(
				"/plugins/*",
				serveStatic({
					root: `${thoriumPath}`,
					onFound(path, c) {
						c.header("Cache-Control", `public, max-age=60`);
					},
				}),
			);
			app.use(
				"/flights/*",
				serveStatic({
					root: `${thoriumPath}`,
					onFound(path, c) {
						c.header("Cache-Control", `public, max-age=60`);
					},
				}),
			);

			app.get("/plugins/:pluginId/:systemId/cypher.css", ({ req }) => {
				const plugin = database.server.plugins.find((p) => p.id === req.param("pluginId"));
				const system = plugin?.aspects.shipSystems.find(
					(p) => p.name === req.param("systemId"),
				) as LongRangeCommPlugin;

				if (!system) return new Response("Not found", { status: 404 });
				return new Response(
					system?.cyphers
						.map(
							({ font, name }) => `@font-face {
  font-family: "${name}";
	font-style: normal;
	font-weight: 400;
	src: url("${font}") format(${getFontFormat(font)})
}\n`,
						)
						.join("") || "",
					{
						headers: { "content-type": "text/css" },
					},
				);
			});

			let httpsRunning: string | null = null;
			if (isProd) {
				// Automatically redirect to HTTPS if this cookie is set,
				// which means the certificate is working correctly in the user's browser
				app.use(async (c, next) => {
					const url = new URL(c.req.url);
					const cookieName = "thorium_https";
					if (httpsRunning && url.protocol === "http:") {
						const cookie = getCookie(c, cookieName);
						if (cookie === "true") {
							url.protocol = "https:";
							return c.redirect(url.toString());
						}
						await next();
					}
					if (url.protocol === "https:") {
						setCookie(c, cookieName, "true", {
							httpOnly: true,
							maxAge: 34560000,
							secure: true,
							path: "/",
						});
						await next();
					}
				});

				const getClientBundleFile = (await import("./utils/.server/embeddedUtils"))
					.getClientBundleFile;
				app.use(async (c) => {
					const path = c.req.path.slice(1);
					try {
						let bundle = await getClientBundleFile(path);
						if (!bundle) {
							bundle = (await getClientBundleFile("index.html"))!;
						}
						const mimeType = getMimeType(bundle.name);
						const headers = new Headers();
						headers.append("content-type", mimeType || "text/plain");
						headers.append("content-disposition", `filename="${bundle.name}"`);
						return new Response(bundle.file, { headers });
					} catch (error) {
						console.error("Error retrieving client bundle file", error);

						return new Response("", { status: 404 });
					}
				});
			}

			exitHandler(dataStoreProps);

			registerExitFunction(async () => {
				const database = DataStore.operations.getStore()!.database;
				await snapshot(database);
			});

			if (isProd) {
				const certs = await loadOrCreateCerts();
				app.get(
					"/ca.crt",
					() =>
						new Response(certs.caPem, {
							headers: {
								"Content-Type": "application/x-x509-ca-cert",
								"Content-Disposition": 'attachment; filename="ThoriumNova-CA.crt"',
							},
						}),
				);

				const tls = {
					cert: certs.serverCertPem,
					key: certs.serverKeyPem,
				};

				const https = Bun.serve({
					port: 443,
					fetch: app.fetch,
					websocket,
					reusePort: true,
					tls,
				});
				httpsRunning = https.url.href;
			}

			const port =
				Number(process.env.PORT) + (process.env.NODE_ENV === "test" ? 1 : 0) ||
				(isProd ? Number(process.env.PORT) || 80 : 3001);

			const server = Bun.serve({
				port,
				fetch: app.fetch,
				websocket,
				reusePort: true,
				http3: true,
			});

			if (isProd) {
				await advertiseMdns(server.port!);
			}

			vanity();
			console.info(`Server running on ${server.url.href}`);
			if (httpsRunning) {
				console.info(`HTTPS running on ${httpsRunning}`);
				return httpsRunning;
			}

			return server.url.href;
		});
	} catch (error) {
		console.error("Error Starting Server:", error);
	}
}
function getFontFormat(file: string) {
	const extension = file?.split(".").at(-1);

	switch (extension) {
		case "otf":
			return "opentype";
		case "eot":
			return "embedded-opentype";
		case "otc":
		case "ttc":
			return "collection";
		case "svg":
			return "svg";
		case "ttf":
			return "truetype";
		case "woff":
			return "woff";
		case "woff2":
			return "woff2";
		default:
			return "unknown";
	}
}
