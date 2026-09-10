import { readdir } from "node:fs/promises";
import path from "node:path";

import type LongRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/LongRangeComm";
import { buildDatabase } from "@thorium/.server/init/buildDatabase";
import { loadOrCreateCerts } from "@thorium/.server/init/certs";
import { setupExitHandler, registerExitFunction } from "@thorium/.server/init/exitHandler";
import { initDefaultPlugin } from "@thorium/.server/init/initDefaultPlugin";
import { createContext, initWebsocket } from "@thorium/.server/init/liveQuery";
import { advertiseMdns } from "@thorium/.server/init/mdns";
import { router } from "@thorium/.server/init/router";
import { thoriumContext } from "@thorium/utils/.server/context";
import { bunDataStoreProps, setBasePath } from "@thorium/utils/.server/db-fs/bunDataStoreProps";
import { loadPlugins } from "@thorium/utils/.server/db-fs/loadPlugins";
import { snapshot } from "@thorium/utils/.server/snapshot";
import { vanity } from "@thorium/utils/.server/vanity";
import { liveQueryPlugin } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import { onCall } from "@thorium/utils/onCallHandler";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { websocket, upgradeWebSocket } from "hono/bun";
import { cors } from "hono/cors";
import { getMimeType } from "hono/utils/mime";

function messageParent(message: any) {
	if (process.send) {
		process.send(message);
	} else {
		postMessage(message);
	}
}
function handleMessage(_message: unknown) {}
process.on("message", (message) => {
	// print message from parent
	handleMessage(message);
});
if (self.addEventListener) {
	self.addEventListener("message", (event) => {
		handleMessage(event.data);
	});
}

export async function startHttpServer({
	isProd,
	sendMessageToParent = messageParent,
}: {
	isProd: boolean;
	sendMessageToParent?: (message: any) => void;
}) {
	try {
		console.info(`Starting Thorium...`);
		sendMessageToParent({ type: "log", message: "Starting Thorium..." });
		const dataStoreProps = bunDataStoreProps(isProd ? "production" : "development");
		return await thoriumContext.run(dataStoreProps, async () => {
			const thoriumPath = thoriumContext.getStore()!.thoriumPath;
			setBasePath(thoriumPath);
			let inited = false;
			try {
				await readdir(thoriumPath);
				const plugins = await Array.fromAsync(
					new Bun.Glob(path.join(thoriumPath, "/plugins/*/manifest.yml")).scan({
						onlyFiles: true,
					}),
				);
				if (plugins.length > 0) {
					inited = true;
				}
			} catch {}
			if (!inited) {
				sendMessageToParent({ type: "log", message: "Loading Default Plugin..." });
				await initDefaultPlugin(isProd);
			}
			const app = new Hono();
			app.use(
				cors({
					origin: "*",
					allowMethods: ["POST", "GET", "OPTIONS"],
					allowHeaders: ["*"],
				}),
			);
			sendMessageToParent({ type: "log", message: "Building Database..." });
			const database = await buildDatabase(loadPlugins);
			sendMessageToParent({ type: "log", message: "Setting Up Server..." });
			const middleware = await liveQueryPlugin({
				createContext,
				initWebsocket,
				router,
				upgradeWebSocket,
				extraContext: database,
				onCall: (opts, result) => onCall(opts, result, database.flight?.ecs),
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
			sendMessageToParent({ type: "log", message: "Checking Ports..." });
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
			setupExitHandler(isProd);
			registerExitFunction(async () => {
				const database = thoriumContext.getStore()!.database;
				await snapshot(database);
			});
			if (isProd) {
				sendMessageToParent({ type: "log", message: "Loading Certs..." });
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
				sendMessageToParent({ type: "log", message: "Loading Client Bundle..." });
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
				sendMessageToParent({ type: "log", message: "Starting Server..." });
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
			sendMessageToParent({ type: "started", address: server.url.href, message: "Server Started" });
			if (isProd) {
				sendMessageToParent({ type: "log", message: `Advertising Server: ${server.url.href}` });
				await advertiseMdns(server.port!);
			}
			sendMessageToParent({ type: "started", address: server.url.href, message: "Server Started" });
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
