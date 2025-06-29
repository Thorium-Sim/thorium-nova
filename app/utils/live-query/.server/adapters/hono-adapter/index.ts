import type { ProcedureCallOptions } from "@thorium/utils/live-query/.server/procedure";
import {
	callProcedure,
	type AnyRouter,
} from "@thorium/utils/live-query/.server/router";
import type {
	inferRouterContext,
	MaybePromise,
} from "@thorium/utils/live-query/.server/types";
import type { Context, HonoRequest, Next } from "hono";
import { createMiddleware } from "hono/factory";
import {
	NETREQUEST_PATH,
	NETSEND_PATH,
} from "@thorium/utils/live-query/constants";
import { ZodError } from "zod";
import type { UpgradeWebSocket } from "hono/ws";
import EventEmitter from "eventemitter3";
import { initWebsocket } from "@thorium/.server/init/liveQuery";

export type CreateContext = <TRouter extends AnyRouter, TContext>(opts: {
	clientId: string;
	context: TContext;
}) => MaybePromise<inferRouterContext<TRouter>>;

export type InitWebsocketParams<TContext> = {
	clientId: string;
	send: (data: any) => void;
	socketEmitter: EventEmitter;
	context: TContext;
};

export type InitWebsocket = <TContext, TRouter extends AnyRouter>(
	opts: InitWebsocketParams<TContext>,
) => MaybePromise<inferRouterContext<TRouter>> & { id: string | number };

export interface HonoHandlerOptions<TRouter extends AnyRouter, TContext> {
	netSendPath?: string;
	netRequestPath?: string;
	webSocketPath?: string;
	router: TRouter;
	createContext?: CreateContext;
	initWebsocket?: InitWebsocket;
	upgradeWebSocket: UpgradeWebSocket;
	extraContext: TContext;
	onCall?: (opts: ProcedureCallOptions) => void | Promise<void>;
}

async function processBody(req: HonoRequest) {
	if (req.header("Content-Type") === "application/json") return req.json();
	if (
		req.header("Content-Type") === "application/x-www-form-urlencoded" ||
		req.header("Content-Type")?.startsWith("multipart/form-data")
	) {
		const { params, ...tempBody } = await req.parseBody({ dot: true });
		if (typeof params === "string") {
			return { ...JSON.parse(params), ...tempBody };
		}
		return tempBody;
	}
	throw new Error("Unable to parse request body.");
}

export async function liveQueryPlugin<TRouter extends AnyRouter, TContext>({
	createContext,
	netSendPath = NETSEND_PATH,
	netRequestPath = NETREQUEST_PATH,
	webSocketPath = "/ws",
	upgradeWebSocket,
	router,
	extraContext,
	onCall,
}: HonoHandlerOptions<TRouter, TContext>) {
	function requestHandler(type: "send" | "request") {
		return async function handleRequest(c: Context) {
			const ctx =
				(await createContext?.({
					clientId: c.req.header("client-id")!,
					context: extraContext,
				})) || {};
			const { path, ...params } = await processBody(c.req);

			try {
				const response = await callProcedure({
					procedures: router._def.procedures,
					path,
					ctx,
					rawInput: params,
					type,
					onCall,
				});

				// Send the result back to the client, regardless of what it is.
				return Response.json(response);
			} catch (err) {
				if (err instanceof ZodError) {
					return Response.json(
						{
							error: "Input Validation Error",
							...err.flatten().fieldErrors,
						},
						{ status: 400 },
					);
				}
				// null indicates that there was no query data to begin with.
				if (err === null) {
					return new Response(null, { status: 204 });
				}
				let message = err;
				if (err instanceof Error) {
					message = err.message;
				}
				console.error(`Error in ${type} ${String(path)}: ${message}`);
				if (
					err instanceof Error
					//  && process.env.NODE_ENV !== "production"
				)
					console.error(err.stack);

				return Response.json({ error: message }, { status: 400 });
			}
		};
	}

	const liveQueryMiddleware = createMiddleware(
		async (c: Context, next: Next) => {
			const url = new URL(c.req.url);
			if (url.pathname === netSendPath) {
				return requestHandler("send")(c);
			}
			if (url.pathname === netRequestPath) {
				return requestHandler("request")(c);
			}
			if (url.pathname === webSocketPath) {
				return upgradeWebSocket((c) => {
					const socketEmitter = new EventEmitter();

					return {
						onClose() {
							socketEmitter.emit("close");
						},
						onError() {
							socketEmitter.emit("error");
						},
						onMessage(evt) {
							socketEmitter.emit("message", evt.data);
						},
						async onOpen(_, ws) {
							socketEmitter.emit("open");

							const result = await Promise.race<string>([
								new Promise<string>((res) => {
									const handleConnection = (data: any) => {
										const { type, ...message } = JSON.parse(data.toString());
										if (type === "clientConnect") {
											const id = message.id;
											socketEmitter.off("message", handleConnection);
											res(id);
										}
									};
									socketEmitter.on("message", handleConnection);
								}),
								new Promise((res, rej) =>
									setTimeout(() => rej(`Client Connect Timeout`), 60 * 1000),
								),
							]);

							const context = createContext?.({
								clientId: result,
								context: extraContext,
							});

							initWebsocket({
								clientId: result,
								send: (data) => ws.send(data),
								socketEmitter,
								context,
							});
						},
					};
				})(c, next);
			}
			await next();
		},
	);

	return liveQueryMiddleware;
}
