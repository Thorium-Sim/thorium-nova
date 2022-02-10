import {ipcMain} from "electron-better-ipc";
export function ipcHandlers() {
  ipcMain.handle("get-address", async () => {
    const {ipAddress} = await import("@thorium/ipAddress");
    const port = parseInt(process.env.PORT || "") || 4444;

    return `http://${ipAddress}:${port}`;
  });
}
