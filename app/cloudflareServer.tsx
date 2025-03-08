import { Hono } from "hono";
import { type Connection, Server, routePartykitRequest } from "partyserver";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { liveQueryPlugin } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import { router } from "@thorium/.server/init/router";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";

export class MyServer extends Server<Env> {
	onMessage(connection: Connection<unknown>, message: string) {
		console.log("message from client:", message);
	}
	async fetch(request: Request): Promise<Response> {
		return new Response("Hello there!");
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const app = new Hono();

		const database = { server: null, flight: null };

		// const middleware = await liveQueryPlugin({
		// 	// @ts-expect-error
		// 	createContext,
		// 	// @ts-expect-error
		// 	initWebsocket,
		// 	router,
		// 	upgradeWebSocket,
		// 	extraContext: database,
		// 	onCall: (opts: any) => {
		// 		const ecs = database?.flight?.ecs;
		// 		if (!ecs || opts.type !== "send") return;
		// 		processTriggers(ecs, {
		// 			event: opts.path,
		// 			values: {
		// 				...opts.rawInput,
		// 			},
		// 		});
		// 	},
		// });

		app.get("/healthcheck", () => new Response("OK"));
		app.post("/snapshot", async () => {
			return new Response("OK");
		});

		return app.fetch(request);
	},
} satisfies ExportedHandler<Env>;
