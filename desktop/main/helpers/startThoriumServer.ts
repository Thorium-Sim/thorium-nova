import {app} from "electron";
import path from "path";
import {fork, ChildProcess} from "child_process";

let child: ChildProcess | null = null;
export async function startThoriumServer() {
  return new Promise<void>(function startServer(resolve, reject) {
    if (child) return;
    child = fork(path.join(app.getAppPath(), "dist/index.js"), [], {
      env: {
        FORK: "1",
        NODE_ENV: "production",
        NODE_PATH: path.join(app.getAppPath(), "dist"),
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
    child.on("message", function (msg) {
      if (msg === "ready") {
        resolve();
      } else {
        reject();
      }
    });
    child.stdout?.on("data", function (data) {
      const message: string = data.toString();
      console.log(message);
    });
    child.stderr?.on("data", function (data) {
      const error = data.toString();
      if (error.includes("DeprecationWarning: Buffer()")) return;
      console.error(error);
    });
    child.on("error", function (err) {
      console.error(err);
    });

    app.on("before-quit", () => {
      if (child) child.kill();
    });
  });
}
export function stopThoriumServer() {
  if (child) child.kill();
  child = null;
}
