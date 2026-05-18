import "reflect-metadata";
import { BrowserWindow, BrowserView, Utils, ApplicationMenu } from "electrobun/bun";

import type { ThoriumRPC } from "./rpc";

// Create RPC instance using BrowserView.defineRPC
const thoriumRPC = BrowserView.defineRPC<ThoriumRPC>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			quit: async () => {
				Utils.quit();
			},
			kiosk: async () => {},
		},
		messages: {},
	},
});

ApplicationMenu.setApplicationMenu([
	{
		submenu: [{ label: "Quit", role: "quit", accelerator: "q" }],
	},
]);

const server = await (
	await import("../app/bunServer")
).startHttpServer({
	isProd: true,
	isKiosk: true,
});

// Create the main window
// Use native renderer (WKWebView) by default, but allow overriding with CEF
new BrowserWindow({
	title: "Thorium Nova",
	url: server,
	frame: {
		width: 1024,
		height: 768,
		x: 100,
		y: 100,
	},
	rpc: thoriumRPC,
});
