import { readdir } from "node:fs/promises";
import path from "node:path";

import type LongRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/LongRangeComm";
import { buildDatabase } from "@thorium/.server/init/buildDatabase";
import { exitHandler, snapshot } from "@thorium/.server/init/exitHandler";
import { initDefaultPlugin } from "@thorium/.server/init/initDefaultPlugin";
import { createContext, initWebsocket } from "@thorium/.server/init/liveQuery";
import { router } from "@thorium/.server/init/router";
import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { DataStore } from "@thorium/utils/.server/db-fs";
import {
	bunDataStoreProps,
	loadPlugins,
	setBasePath,
} from "@thorium/utils/.server/db-fs/bunDataStoreProps";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { vanity } from "@thorium/utils/.server/vanity";
import { liveQueryPlugin } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import type { ProcedureCallOptions } from "@thorium/utils/live-query/.server/procedure";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { websocket, upgradeWebSocket } from "hono/bun";
import { getMimeType } from "hono/utils/mime";

import { isObject } from "./typeguards/isObject";

export async function startHttpServer({ isProd, isKiosk }: { isProd: boolean; isKiosk: boolean }) {
	try {
		console.info(`Starting Thorium...`);
		return DataStore.operations.run(bunDataStoreProps, async () => {
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

			app.get("/healthcheck", () => new Response("OK", { status: 200 }));

			app.post("/snapshot", async () => {
				await snapshot();
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

			if (isProd) {
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

			exitHandler();

			const port =
				Number(process.env.PORT) + (process.env.NODE_ENV === "test" ? 1 : 0) ||
				(isProd ? Number(process.env.PORT) || 4444 : 3001);

			const server = Bun.serve({
				port,
				fetch: app.fetch,
				websocket,
				reusePort: true,
			});

			vanity();
			// This exact string is required for the kiosk to recognize
			// that the server has started.
			console.info(`Server running on ${server.url.href}`);

			if (isProd) {
				let tls: { cert: string; key: string } | undefined;
				if (isKiosk) {
					const bundledFiles = await readdir(import.meta.dirname);
					const certFile = bundledFiles.find((f) => f.startsWith("server") && f.endsWith(".cert"));
					const keyFile = bundledFiles.find((f) => f.startsWith("server") && f.endsWith(".key"));
					if (certFile && keyFile) {
						tls = {
							cert: await Bun.file(path.join(import.meta.dirname, certFile)).text(),
							key: await Bun.file(path.join(import.meta.dirname, keyFile)).text(),
						};
					}
				} else {
					const { certFile, keyFile } = await (
						await import("./utils/.server/embeddedUtils")
					).getSSLCert();
					if (certFile && keyFile) {
						tls = {
							// TODO: Support user-provided TLS certificates
							cert: await certFile.text(),
							key: await keyFile.text(),
						};
					}
				}
				if (tls) {
					const https = Bun.serve({
						port: port + 1,
						fetch: app.fetch,
						websocket,
						reusePort: true,
						tls,
					});
					console.info(`HTTPS running on ${https.url.href}`);
				}
			}
			return `http://${server.hostname}:${server.port}`;
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
