import {ipcMain} from "electron-better-ipc";
import {hostSecret} from "../hostSecret";
export function ipcHandlers() {
  ipcMain.handle("get-address", async () => {
    const {ipAddress} = await import("@thorium/ipAddress");
    const port = Number.parseInt(process.env.PORT || "") || 4444;

    return `http://${ipAddress}:${port}`;
  });
  ipcMain.handle("get-secret", async () => {
    return hostSecret;
  });
}
