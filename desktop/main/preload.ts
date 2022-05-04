import {ipcRenderer} from "electron";

let updateHandler = (message: string) => {};
ipcRenderer.on("update-message", (event, message) => {
  updateHandler(message);
});

const thorium = {
  getAddress: function () {
    return ipcRenderer.invoke("get-address");
  },
  getHostSecret: function () {
    return ipcRenderer.invoke("get-secret");
  },
  registerUpdateHandler: function (handler: typeof updateHandler) {
    updateHandler = handler;
  },
};
window.thorium = thorium;

declare global {
  interface Window {
    isHeadless: boolean;
    thorium: {
      getAddress: () => Promise<string>;
      getHostSecret: () => Promise<string>;
    };
  }
}
