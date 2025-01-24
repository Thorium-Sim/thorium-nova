import { buildDatabase } from "@thorium/.server/init/buildDatabase";
import { initDefaultPlugin } from "@thorium/.server/init/initDefaultPlugin";
import { router } from "@thorium/.server/init/router";
import { createContext, initWebsocket } from "@thorium/.server/init/liveQuery";
import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { liveQueryPlugin } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import { setBasePath } from "@thorium/utils/.server/db-fs";
import { exitHandler, snapshot } from "@thorium/.server/init/exitHandler";
import { serveStatic } from "hono/bun";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { readdir } from "node:fs/promises";
import { vanity } from "@thorium/utils/.server/vanity";
const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

console.info(`Starting Thorium...`);

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
const database = await buildDatabase();
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
				shipId: opts.ctx.ship?.id,
				clientId: opts.ctx.client.id,
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

exitHandler();

const server = Bun.serve({
	port: process.env.PORT || 3001,
	fetch: app.fetch,
	websocket,
});

vanity();
console.info(`Server running on ${server.url.href}`);
