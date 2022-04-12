import path from "path";
import {app, BrowserWindow, dialog, shell} from "electron";
import {is} from "electron-util";
import fs from "fs";
import {restoreMenubar} from "./helpers/menu";
import {
  startThoriumServer,
  stopThoriumServer,
} from "./helpers/startThoriumServer";
import {ipcHandlers} from "./helpers/ipcHandlers";
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
const port = Number(process.env.PORT) || 4444;

async function createWindow() {
  await startThoriumServer();
  ipcHandlers();
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
    width: 1024,
    height: 768,
    minHeight: 768,
    minWidth: 1024,
    backgroundColor: "#251029",
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  win.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: "deny"};
  });
  win.webContents.on("new-window", function (e, url) {
    // e.preventDefault();
  });

  // We add 1 to the port, since we want to connect to the HTTPS server
  // which is 1 more than the default port
  win.loadURL(`https://localhost:${port + 1}`);
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
