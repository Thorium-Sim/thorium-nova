import { app } from "electron";
import path from "node:path";
import { fork, type ChildProcess } from "node:child_process";
import { hostSecret } from "../hostSecret";
import waitOn from "wait-on";
import { port } from "./settings";

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
	child.stdout?.on("data", (data) => {
		const message: string = data.toString();
		console.info(message);
	});
	child.stderr?.on("data", (data) => {
		const error = data.toString();
		if (error.includes("DeprecationWarning: Buffer()")) return;
		console.error(error);
	});
	child.on("error", (err) => {
		console.error(err);
	});

	await waitOn({
		resources: [`http://0.0.0.0:${port}/healthcheck`],
	});
}

app.on("before-quit", async (event) => {
	if (child) {
		event.preventDefault();
		await stopThoriumServer();
	}
	app.exit();
});

export async function stopThoriumServer() {
	if (child) {
		await Promise.race([
			fetch(`http://0.0.0.0:${port}/snapshot`, { method: "POST" }),
			new Promise((res) => setTimeout(res, 5000)),
		]);
		child.kill();
		child = null;
	}
}
