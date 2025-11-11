import { encode } from "@msgpack/msgpack";
import type { PubSub } from "@thorium/utils/live-query/.server/pubsub";
import {
	type AnyRouter,
	callProcedure,
} from "@thorium/utils/live-query/.server/router";
import type { inferRouterContext } from "@thorium/utils/live-query/.server/types";
import { SnapshotInterpolation } from "@thorium/utils/snapshot-interpolation/src";
import type { Snapshot } from "@thorium/utils/snapshot-interpolation/src/types";
import EventEmitter from "eventemitter3";

type SocketMessages =
	| { type: "connected" }
	| {
			type: "netRequestData";
			data: { id: string; error: any } | { id: string; data: any };
	  }
	| { type: "revalidateAll" }
	| Snapshot;
type IncomingMessage =
	| {
			type: "netRequest";
			id: string;
			path: string;
			params: any;
	  }
	| { type: "netRequestEnd"; id: string }
	| { type: "dataStream"; id: string; path: string; params: any }
	| { type: "dataStreamEnd"; id: string };

export class ServerClient<TRouter extends AnyRouter> {
	SI = new SnapshotInterpolation();
	// This is necessary because of "Illegal Invocation" errors around the connection.socket
	// object. No idea how to solve it, so I just don't assign it to the class and use the
	// ee to pass messages to it.
	private ee = new EventEmitter();
	public connected = false;
	private subscriptions: Map<string, () => void> = new Map();
	protected dataStreams: Map<string, { path: string; params: any }> = new Map();
	constructor(
		public id: string,
		protected router: TRouter,
		private pubsub: PubSub<TRouter>,
	) {}
	encode(data: any) {
		return encode(data);
	}
	public async initWebSocket(
		send: (data: any) => void,
		socketEmitter: EventEmitter,
		context: inferRouterContext<TRouter> & { pubsub?: PubSub<any> },
	) {
		const sendData = (data: SocketMessages) => {
			try {
				const encodedData = this.encode(data);
				send(encodedData);
			} catch (err) {
				console.error(err);
				console.error("Data from the above error:", data);
			}
		};

		this.ee.removeAllListeners();
		this.ee.on("send", (data) => sendData(data));
		this.connected = true;

		socketEmitter.once("close", () => {
			this.connected = false;
			this.subscriptions.forEach((unsub) => {
				unsub();
			});

			this.subscriptions.clear();
			this.connectionClosed();
		});

		this.subscriptions.set(
			"all",
			this.pubsub.subscribeAll(() => {
				sendData({ type: "revalidateAll" });
			}),
		);
		// Set up the whole netSend process for calling input functions
		socketEmitter.on("message", async (data) => {
			try {
				const messageData = JSON.parse(data.toString()) as IncomingMessage;
				switch (messageData.type) {
					case "netRequest": {
						const { path, id, params = {} } = messageData;

						const handleNetRequestError = (err: unknown) => {
							if (err === null) return;
							let message = err;
							if (err instanceof Error) {
								message = err.message;
							}
							console.error(`Error in request ${path}: ${message}`);
							if (err instanceof Error) console.error(err.stack);
							let jsonData = message;
							try {
								if (message) {
									jsonData = JSON.parse(message as any);
								}
							} catch {
								// Do nothing
							}
							sendData({
								type: "netRequestData",
								data: {
									id,
									error: jsonData,
								},
							});
							this.subscriptions.get(id)?.();
							this.subscriptions.delete(id);
						};

						// If this client is already subscribed to this request, ignore the request.
						// It will already get the data it needs from the other request.
						try {
							if (!this.subscriptions.get(id)) {
								// Create the subscription
								const handleRequest = async (publish: any) => {
									try {
										const data = await callProcedure({
											procedures: this.router._def.procedures,
											path: path,
											ctx: context,
											rawInput: params,
											publish,
											type: "request",
										});

										sendData({ type: "netRequestData", data: { id, data } });

										return data as any;
									} catch (err) {
										handleNetRequestError(err);
									}
								};
								function index(obj: any, i: keyof typeof obj) {
									return obj[i];
								}
								const unSub = path
									.split(".")
									.reduce(index, this.pubsub.subscribe)(handleRequest, this.id);
								if (unSub) {
									this.subscriptions.set(id, unSub);
								}
							}
							// Collect and send the initial data
							const data = await callProcedure({
								procedures: this.router._def.procedures,
								path: path,
								ctx: context,
								rawInput: params,
								type: "request",
							});

							sendData({
								type: "netRequestData",
								data: {
									id,
									data,
								},
							});
						} catch (err) {
							handleNetRequestError(err);
						}
						break;
					}
					case "netRequestEnd": {
						const { id } = messageData;
						if (this.subscriptions.get(id)) {
							this.subscriptions.get(id)?.();
							this.subscriptions.delete(id);
						}
						break;
					}
					case "dataStream": {
						const { id, path, params } = messageData;
						if (this.dataStreams.get(id)) return;
						this.dataStreams.set(id, { path, params });
						this.sendDataStream();
						break;
					}
					case "dataStreamEnd": {
						const { id } = messageData;
						this.dataStreams.delete(id);
						break;
					}
				}
			} catch (err) {
				console.error(
					`Client ${this.id} sent invalid request data:${
						typeof data === "object" ? JSON.stringify(data) : data
					}`,
				);
				console.error(err);
			}
		});

		// Send a message to the client indicating that the connection is open
		sendData({
			type: "connected",
		});

		this.connectionOpened();
	}
	send(data: SocketMessages) {
		this.ee.emit("send", data);
	}
	public async sendDataStream() {
		// Filter the list of entities provided
	}
	connectionOpened() {}
	connectionClosed() {}
}
