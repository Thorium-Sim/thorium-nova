import {ipcRenderer} from "electron";

const thorium = {
  getAddress: function () {
    return ipcRenderer.invoke("get-address");
  },
};
window.thorium = thorium;

declare global {
  interface Window {
    isHeadless: boolean;
    thorium: {
      getAddress: () => Promise<string>;
    };
  }
}
