import type { RPCSchema } from "electrobun";

export type ThoriumRPC = {
	bun: RPCSchema<{
		requests: {
			getServerAddress: {
				response: { address: string };
			};
			getIPAddress: {
				response: { address: string };
			};
			startServer: {};
			stopServer: {};
			restartServer: {};
		};
		messages: {};
	}>;

	webview: RPCSchema<{
		requests: {};
		messages: {
			systemEvent: { type: string; details: any };

			logMessage: { level: "info" | "warn" | "error"; message: string };
			redirect: { address: string };
		};
	}>;
};
