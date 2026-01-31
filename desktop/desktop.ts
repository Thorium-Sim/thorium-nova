import Electrobun, {
	BrowserWindow,
	BrowserView,
	ApplicationMenu,
} from "electrobun/bun";
import { startHttpServer } from "../app/bunServer";
import type { ThoriumRPC } from "./rpc";

const rpc = BrowserView.defineRPC<ThoriumRPC>({
	handlers: {
		requests: {},
		messages: {
			"*": (messageName, payload) => {
				console.log(`📨 Message received: ${messageName}`, payload);
			},
		},
	},
});
ApplicationMenu.setApplicationMenu([
	{
		submenu: [{ label: "Quit", role: "quit", accelerator: "q" }],
	},
]);

const serverAddress = await startHttpServer();
// Create main playground window
const mainWindow = new BrowserWindow({
	title: "Thorium Nova",
	url: serverAddress,
	renderer: "native",
	frame: {
		width: 1400,
		height: 900,
		x: 100,
		y: 100,
	},
	titleBarStyle: "default",
	rpc,
});

mainWindow.webview.on("dom-ready", () => {
	rpc.send.logMessage({ level: "info", message: "Starting server..." });

	rpc.send.logMessage({ level: "info", message: "Server started." });
});
