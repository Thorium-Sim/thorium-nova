import {app, BrowserWindow} from "electron";
import path from "path";
import {fork} from "child_process";
import {ipcMain} from "electron-better-ipc";
let restartCount = 0;
export default function startThoriumServer(browserWindow: BrowserWindow) {
  function startServer() {
    const child = fork(path.join(app.getAppPath(), "dist/index.js"), [], {
      env: {
        FORK: "1",
        NODE_ENV: "production",
        ...process.env,
      },
      // execArgv: [
      //   "--nouse-idle-notification",
      //   "--expose-gc",
      //   "--max-new-space-size=2048",
      //   "--max-old-space-size=8192",
      // ],
      silent: true,
    });

    child.stdout?.on("data", function (data) {
      const message: string = data.toString();
      ipcMain.callRenderer(browserWindow, "server_info", message);
    });
    child.stderr?.on("data", function (data) {
      const error = data.toString();
      if (error.includes("DeprecationWarning: Buffer()")) return;
      ipcMain.callRenderer(browserWindow, "server_info", error);
    });
    child.on("close", function (code) {
      if (browserWindow && restartCount < 10) {
        try {
          ipcMain.callRenderer(
            browserWindow,
            "server_info",
            `Server process closed. Restarting...`
          );
          startServer();
        } catch {
          // Do nothing, we're probably shutting down.
        }
      } else {
        if (browserWindow) {
          ipcMain.callRenderer(
            browserWindow,
            "server_info",
            `Server process closed. Too many restarts. Closing Thorium Server.`
          );
        }
        app.quit();
        return;
      }
      restartCount++;
    });
    child.on("error", function (err) {
      ipcMain.callRenderer(
        browserWindow,
        "server_info",
        `Error in server process: ${err.message}`
      );
      console.error(err);
    });

    app.on("before-quit", () => {
      child.kill();
    });
  }
  startServer();
}

setInterval(() => {
  restartCount = Math.max(0, restartCount - 1);
}, 10 * 1000);
