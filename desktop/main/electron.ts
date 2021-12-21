import path from "path";
import {app, BrowserWindow, dialog} from "electron";
import {is} from "electron-util";
import fs from "fs";
import {restoreMenubar} from "./helpers/menu";
import {
  startThoriumServer,
  stopThoriumServer,
} from "./helpers/startThoriumServer";
let win: BrowserWindow | null = null;
app.enableSandbox();

function loadFile(url: string) {
  dialog.showMessageBox({message: url});
}
let loaded = false;
let loadedPath: string | null = null;
app.on("will-finish-launching", () => {
  app.on("open-file", function (ev, p) {
    loadedPath = p;
    if (loaded) {
      loadFile(p);
    }
  });
});

const cert = fs.readFileSync(
  path.join(
    app.getAppPath(),
    is.development ? `desktop/resources/server.cert` : `../app/server.cert`
  ),
  "utf8"
);
const port = process.env.PORT || 4444;

async function createWindow() {
  await startThoriumServer();
  loaded = true;
  if (loadedPath) {
    loadFile(loadedPath);
  }
  // TODO: Manage this with the multi-window manager some day
  app.on(
    "certificate-error",
    (event, webContents, url, error, certificate, callback) => {
      // On certificate error we disable default behavior (stop loading the page)
      // and we then say "it is all fine - true" to the callback
      event.preventDefault();
      callback(certificate.data === cert);
    }
  );
  restoreMenubar(app);
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 650,
    backgroundColor: "#2e2c29",
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      contextIsolation: false,
    },
    show: false,
  });

  win.loadURL(`https://localhost:${port}`);
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

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  stopThoriumServer();
  app.quit();
});

app.on("activate", () => {
  if (win === null && app.isReady()) {
    createWindow();
  }
});
