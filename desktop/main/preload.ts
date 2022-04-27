import {ipcRenderer} from "electron";

const thorium = {
  getAddress: function () {
    return ipcRenderer.invoke("get-address");
  },
  getHostSecret: function () {
    return ipcRenderer.invoke("get-secret");
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
