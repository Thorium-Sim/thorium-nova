import path from "path";
import {app, BrowserWindow, dialog} from "electron";
import {is} from "electron-util";
import fs from "fs";
import {restoreMenubar} from "./helpers/menu";
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

async function createWindow() {
  loaded = true;
  if (loadedPath) {
    loadFile(loadedPath);
  }
  // TODO: Manage this with the multi-window manager some day
  app.on(
    "certificate-error",
    (event, webContents, url, error, certificate, callback) => {
      // On certificate error we disable default behaviour (stop loading the page)
      // and we then say "it is all fine - true" to the callback
      event.preventDefault();
      const cert = fs.readFileSync(
        path.resolve(`../resources/server.cert`),
        "utf8"
      );
      callback(certificate.data === cert);
    }
  );
  restoreMenubar(app);
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 650,
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      contextIsolation: false,
    },
    show: false,
  });

  const isDev = is.development;
  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadURL(`file://${path.join(__dirname, "public/index.html")}`);
  }
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

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (win === null && app.isReady()) {
    createWindow();
  }
});
