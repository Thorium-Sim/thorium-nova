import {app} from "electron";
import path from "path";
import {fork, ChildProcess} from "child_process";
import {hostSecret} from "../hostSecret";

let child: ChildProcess | null = null;
export async function startThoriumServer() {
  if (child) return;

  child = fork(path.join(app.getAppPath(), "dist/index.js"), [], {
    env: {
      FORK: "1",
      NODE_ENV: "production",
      NODE_PATH: path.join(app.getAppPath(), "dist"),
      HOST_SECRET: hostSecret,
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
  child.once("message", function (msg) {
    if (msg === "ready") {
    } else if (msg === "error") {
    }
  });
  child.stdout?.on("data", function (data) {
    const message: string = data.toString();
    console.info(message);
  });
  child.stderr?.on("data", function (data) {
    const error = data.toString();
    if (error.includes("DeprecationWarning: Buffer()")) return;
    console.error(error);
  });
  child.on("error", function (err) {
    console.error(err);
  });

  await new Promise(res => setTimeout(res, 1000));
}

app.on("before-quit", async event => {
  if (child) {
    event.preventDefault();
    await stopThoriumServer();
  }
  app.exit();
});

export async function stopThoriumServer() {
  if (child) {
    await Promise.race([
      new Promise<void>(res => {
        child?.once("message", message => {
          if (message === "saved") {
            res();
          }
        });
        child?.send("save");
      }),
      new Promise(res => setTimeout(res, 5000)),
    ]);
    child.kill();
    child = null;
  }
}
