import {ipcMain} from "electron-better-ipc";
export function ipcHandlers() {
  ipcMain.answerRenderer("get-ipAddress", async () => {
    const {ipAddress} = await import("@thorium/ipAddress");
    return ipAddress;
  });
  ipcMain.answerRenderer("get-port", async () => {
    const port = parseInt(process.env.PORT || "") || 4444;
    return port;
  });
}
