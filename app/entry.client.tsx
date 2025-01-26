import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

// TODO Aug 23 2021 - Configure this with the methods that are available
// via Tauri IPC
declare global {
	interface Window {
		isHeadless: boolean;
		thorium: {
			clipboardWriteText: (text: string) => Promise<boolean>;
			getAddress: () => Promise<string>;
			getHostSecret: () => Promise<string>;
			registerUpdateHandler: (handler: (update: string) => void) => void;
		};
	}
}

window.isHeadless = false;
window.addEventListener(
	"dragover",
	(e) => {
		e.preventDefault();
	},
	false,
);
window.addEventListener(
	"drop",
	(e) => {
		e.preventDefault();
	},
	false,
);

startTransition(() => {
	hydrateRoot(document, <HydratedRouter />);
});
