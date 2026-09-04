import "reflect-metadata";
import path from "node:path";

import { BrowserWindow, BrowserView, ApplicationMenu } from "electrobun";
import Electrobun, { PATHS } from "electrobun/main";

import type { ThoriumRPC } from "./rpc";
const controller = new AbortController();

// Create RPC instance using BrowserView.defineRPC
const thoriumRPC = BrowserView.defineRPC<ThoriumRPC>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			quit: async () => {},
			kiosk: async () => {},
		},
		messages: {
			rendererReady: () => {
				if (controller.signal.aborted) return;
				const _serverProcess = Bun.spawn(
					[path.join(PATHS.RESOURCES_FOLDER, "app", "thorium-nova-server")],
					{
						serialization: "json",
						signal: controller.signal,
						ipc: (message) => {
							if (message && typeof message === "object" && "type" in message) {
								switch (message.type) {
									case "started":
										thoriumRPC.send.logMessage({
											level: "info",
											message: `Started: ${message.address}`,
										});
										break;
									case "log":
										thoriumRPC.send.logMessage({ level: "info", message: message.message });
										break;
								}
							}
						},
					},
				);
			},
		},
	},
});

ApplicationMenu.setApplicationMenu([
	{
		submenu: [{ label: "Quit", role: "quit", accelerator: "q" }],
	},
	{
		label: "Edit",
		submenu: [
			{ role: "undo" },
			{ role: "redo" },
			{ type: "separator" },
			{ role: "cut" },
			{ role: "copy" },
			{ role: "paste" },
			{ role: "selectAll" },
		],
	},
]);

// Create the main window
// Use native renderer (WKWebView) by default, but allow overriding with CEF
new BrowserWindow({
	title: "Thorium Nova",
	url: "views://mainview/index.html",
	frame: {
		width: 1024,
		height: 768,
		x: 100,
		y: 100,
	},
	rpc: thoriumRPC,
});

Electrobun.events.on("before-quit", () => {
	controller.abort();
});
process.on("exit", (code) => {
	controller.abort(code);
});
