import type { RPCSchema } from "electrobun";

export type ThoriumRPC = {
	bun: RPCSchema<{
		requests: {
			getServerAddress: {
				params: unknown;
				response: { address: string };
			};
			getIPAddress: {
				params: unknown;
				response: { address: string };
			};
			startServer: { params: unknown; response: unknown };
			stopServer: { params: unknown; response: unknown };
			restartServer: { params: unknown; response: unknown };
			quit: { params: unknown; response: unknown };
			kiosk: { params: unknown; response: unknown };
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
