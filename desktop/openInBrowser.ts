const { spawn } = require("child_process");
export function openInBrowser(url: string) {
	const cmd =
		process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
	spawn(cmd, [url], { shell: true, detached: true });
}
// open(`http://localhost:${port}/status`);
