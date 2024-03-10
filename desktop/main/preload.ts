const { ipcRenderer } = require("electron");

let updateHandler = (message: string) => {
	console.info(message);
};
ipcRenderer.on("update-message", (event, message) => {
	updateHandler(message);
});

const thorium = {
	getAddress: () => ipcRenderer.invoke("get-address"),
	getHostSecret: () => ipcRenderer.invoke("get-secret"),
	registerUpdateHandler: (handler: typeof updateHandler) => {
		updateHandler = handler;
	},
};

// @ts-expect-error
window.thorium = thorium;
