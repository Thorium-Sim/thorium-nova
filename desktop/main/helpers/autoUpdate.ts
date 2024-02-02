import {autoUpdater} from "electron-updater";
import {BrowserWindow, shell} from "electron";

let win: BrowserWindow | null = null;
export function initWin(newWin: BrowserWindow) {
  win = newWin;
  win.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: "deny"};
  });
  win.on("closed", () => {
    win = null;
  });
  win.on("ready-to-show", () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
}
function sendStatusToWindow(text: string) {
  win?.webContents.send("update-message", text);
}
autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});
autoUpdater.on("update-available", info => {
  sendStatusToWindow("Update available.");
});
autoUpdater.on("update-not-available", info => {
  sendStatusToWindow("");
});
autoUpdater.on("error", err => {
  sendStatusToWindow("Error in auto-updater. " + err);
});
autoUpdater.on("download-progress", progressObj => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  sendStatusToWindow(log_message);
});
autoUpdater.on("update-downloaded", info => {
  sendStatusToWindow("Update downloaded - restart to apply");
});
