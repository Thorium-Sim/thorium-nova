import { readdir } from "node:fs/promises";

import type LongRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/LongRangeComm";
import { buildDatabase } from "@thorium/.server/init/buildDatabase";
import { loadOrCreateCerts } from "@thorium/.server/init/certs";
import { exitHandler, registerExitFunction } from "@thorium/.server/init/exitHandler";
import { initDefaultPlugin } from "@thorium/.server/init/initDefaultPlugin";
import { createContext, initWebsocket } from "@thorium/.server/init/liveQuery";
import { advertiseMdns } from "@thorium/.server/init/mdns";
import { router } from "@thorium/.server/init/router";
import { thoriumContext } from "@thorium/utils/.server/context";
import { bunDataStoreProps, setBasePath } from "@thorium/utils/.server/db-fs/bunDataStoreProps";
import { loadPlugins } from "@thorium/utils/.server/db-fs/loadPlugins";
import { notifyActions, notifyEvents } from "@thorium/utils/.server/notifyActions";
import { processTriggers } from "@thorium/utils/.server/processTriggers";
import { snapshot } from "@thorium/utils/.server/snapshot";
import { vanity } from "@thorium/utils/.server/vanity";
import { liveQueryPlugin } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import type { ProcedureCallOptions } from "@thorium/utils/live-query/.server/procedure";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { websocket, upgradeWebSocket } from "hono/bun";
import { cors } from "hono/cors";
import { getMimeType } from "hono/utils/mime";

import { isObject } from "./typeguards/isObject";

process.on("message", (_message) => {
	// print message from parent
});

export async function startHttpServer({ isProd }: { isProd: boolean }) {
	try {
		console.info(`Starting Thorium...`);
		process.send?.({ type: "log", message: "Starting Thorium..." });

		const dataStoreProps = bunDataStoreProps(isProd ? "production" : "development");
		return await thoriumContext.run(dataStoreProps, async () => {
			const thoriumPath = thoriumContext.getStore()!.thoriumPath;
			setBasePath(thoriumPath);
			let inited = false;
			try {
				await readdir(thoriumPath);
				inited = true;
			} catch {}
			if (!inited) {
				process.send?.({ type: "log", message: "Loading Default Plugin..." });
				await initDefaultPlugin();
			}
			const app = new Hono();
			app.use(
				cors({
					origin: "*",
					allowMethods: ["POST", "GET", "OPTIONS"],
					allowHeaders: ["*"],
				}),
			);
			process.send?.({ type: "log", message: "Building Database..." });
			const database = await buildDatabase(loadPlugins);
			process.send?.({ type: "log", message: "Setting Up Server..." });
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
					void notifyActions(opts.path, rawInputObj);
					void notifyEvents(opts.path, {
						...rawInputObj,
						...(typeof result === "object" && !Array.isArray(result) ? result : {}),
					});
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
			app.get(
				"/https",
				() =>
					new Response(httpsPort.toString(), {
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
			process.send?.({ type: "log", message: "Checking Ports..." });

			// Quick check to see if root ports are allowed.
			let rootPortsAllowed = true;
			let testHttpServer, testHttpsServer;
			try {
				testHttpServer = Bun.serve({ port: 80, websocket, fetch: () => {} });
				if (isProd) {
					testHttpsServer = Bun.serve({ port: 443, websocket, fetch: () => {} });
				}
			} catch {
				rootPortsAllowed = false;
			} finally {
				await testHttpServer?.stop(true);
				await testHttpsServer?.stop(true);
			}
			const port =
				Number(process.env.PORT) + (process.env.NODE_ENV === "test" ? 1 : 0) ||
				(isProd ? Number(process.env.PORT) || (rootPortsAllowed ? 80 : 4444) : 3001);
			const httpsPort = process.env.HTTPS_PORT
				? Number(process.env.HTTPS_PORT)
				: process.env.PORT
					? Number(process.env.PORT) + 1
					: rootPortsAllowed
						? 443
						: port + 1;
			exitHandler(dataStoreProps);
			registerExitFunction(async () => {
				const database = thoriumContext.getStore()!.database;
				await snapshot(database);
			});
			if (isProd) {
				process.send?.({ type: "log", message: "Loading Certs..." });

				const certs = await loadOrCreateCerts();
				app.get("/ca.crt", () => {
					return new Response(certs.caPem, {
						headers: {
							"Content-Type": "application/x-x509-ca-cert",
							"Content-Disposition": 'attachment; filename="ThoriumNova-CA.crt"',
						},
					});
				});
				const tls = {
					cert: certs.serverCertPem,
					key: certs.serverKeyPem,
				};
				process.send?.({ type: "log", message: "Loading Client Bundle..." });

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
				process.send?.({ type: "log", message: "Starting Server..." });

				const https = Bun.serve({
					port: httpsPort,
					fetch: app.fetch,
					websocket,
					reusePort: true,
					tls,
					http3: true,
				});
				httpsRunning = https.url.href;
			}
			const server = Bun.serve({
				port,
				fetch: app.fetch,
				websocket,
				reusePort: true,
			});
			vanity();
			console.info(`Server running on ${server.url.href}`);
			if (httpsRunning) {
				console.info(`HTTPS running on ${httpsRunning}`);
			}
			process.send?.({ type: "started", address: server.url.href });
			if (isProd) {
				process.send?.({ type: "log", message: `Advertising Server: ${server.url.href}` });
				await advertiseMdns(server.port!);
			}
			process.send?.({ type: "started", address: server.url.href });
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
