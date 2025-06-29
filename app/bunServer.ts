import { buildDatabase } from "@thorium/.server/init/buildDatabase";
import { initDefaultPlugin } from "@thorium/.server/init/initDefaultPlugin";
import { router } from "@thorium/.server/init/router";
import { createContext, initWebsocket } from "@thorium/.server/init/liveQuery";
import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { liveQueryPlugin } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import { exitHandler, snapshot } from "@thorium/.server/init/exitHandler";
import { serveStatic } from "hono/bun";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { readdir } from "node:fs/promises";
import { vanity } from "@thorium/utils/.server/vanity";
import { getMimeType } from "hono/utils/mime";
import { getClientBundleFile } from "@thorium/utils/.server/getClientBundleFile";
import { embeddedFiles, type ServerWebSocket } from "bun";
import {
	bunDataStoreProps,
	loadPlugins,
	setBasePath,
} from "@thorium/utils/.server/db-fs/bunDataStoreProps";
import { DataStore } from "@thorium/utils/.server/db-fs";

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();
try {
	console.info(`Starting Thorium...`);
	DataStore.operations.run(bunDataStoreProps, async () => {
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
			// @ts-expect-error
			createContext,
			// @ts-expect-error
			initWebsocket,
			router,
			upgradeWebSocket,
			extraContext: database,
			onCall: (opts: any) => {
				const ecs = database?.flight?.ecs;
				if (!ecs || opts.type !== "send") return;
				processTriggers(ecs, {
					event: opts.path,
					values: {
						...opts.rawInput,
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

		if (process.env.NODE_ENV === "production") {
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
			Number(process.env.PORT) || process.env.NODE_ENV === "production"
				? 4444
				: 3001;

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

		if (process.env.NODE_ENV === "production") {
			// @ts-expect-error
			await import("./.server/server.cert", {
				with: { type: "file" },
			});
			// @ts-expect-error
			await import("./.server/server.key", {
				with: { type: "file" },
			});

			const certFile = embeddedFiles.find(
				// @ts-expect-error Bun adds the file name
				(file) => file.name === "server.cert",
			);
			// @ts-expect-error Bun adds the file name
			const keyFile = embeddedFiles.find((file) => file.name === "server.key");

			if (certFile && keyFile) {
				const https = Bun.serve({
					port: port + 1,
					fetch: app.fetch,
					websocket,
					reusePort: true,
					tls: {
						// TODO: Support user-provided TLS certificates
						cert: await certFile.text(),
						key: await keyFile.text(),
					},
				});
				console.info(`HTTPS running on ${https.url.href}`);
			}
		}
	});
} catch (error) {
	console.error("Error Starting Server:", error);
}
