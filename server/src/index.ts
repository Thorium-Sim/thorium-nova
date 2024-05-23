import "./init/polyfill";
import { setBasePath } from "@thorium/db-fs";
import buildHTTPServer from "./init/httpServer";
import path from "node:path";
import { existsSync } from "node:fs";
import { liveQueryPlugin } from "@thorium/live-query/adapters/fastify-adapter";
import { rootPath, thoriumPath } from "./utils/appPaths";
import { buildDatabase } from "./init/buildDatabase";
import { createContext, createWSContext } from "./init/liveQuery";
import { router } from "./init/router";
import { startServer } from "./init/startServer";
import { exitHandler } from "./init/exitHandler";
import { initDefaultPlugin } from "./init/initDefaultPlugin";
import { processTriggers } from "./utils/evaluateEntityQuery";

setBasePath(thoriumPath);

export async function init() {
	// Initialize the database if it doesn't exist
	if (!existsSync(thoriumPath)) {
		await initDefaultPlugin();
	}

	const database = await buildDatabase();
	const app = await buildHTTPServer({
		staticRoot: path.join(rootPath, "public/"),
	});
	await app.register(liveQueryPlugin, {
		createContext: createContext as any,
		createWSContext: createWSContext as any,
		router,
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

	await startServer(app);

	exitHandler();
}

init();
