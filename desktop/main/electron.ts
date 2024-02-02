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
import {autoUpdater} from "electron-updater";
import {initWin} from "./helpers/autoUpdate";
import {port} from "./helpers/settings";

let win: BrowserWindow | null = null;
app.enableSandbox();
app.commandLine.appendSwitch("ignore-certificate-errors");

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

async function createWindow() {
  const cert = fs.readFileSync(
    path.join(
      app.getAppPath(),
      is.development ? `desktop/resources/server.cert` : `../app/server.cert`
    ),
    "utf8"
  );
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

  win = new BrowserWindow({
    width: 1024,
    height: 768,
    minHeight: 768,
    minWidth: 1024,
    backgroundColor: "#251029",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
    show: false,
  });

  initWin(win);
  await win.loadFile("index.html");
  await startThoriumServer();
  ipcHandlers();
  loaded = true;
  if (loadedPath) {
    loadFile(loadedPath);
  }
  restoreMenubar(app);

  // We add 1 to the port, since we want to connect to the HTTPS server
  // which is 1 more than the default port
  await win.loadURL(`http://0.0.0.0:${port}`);
}

app.whenReady().then(async () => {
  await createWindow();
  try {
    await autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    // Ignore it
  }
});

app.on("window-all-closed", async () => {
  await stopThoriumServer();
  app.quit();
});

app.on("activate", () => {
  if (win === null && app.isReady()) {
    createWindow();
  }
});
