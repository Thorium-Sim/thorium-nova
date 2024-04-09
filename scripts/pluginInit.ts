import { execSync } from "node:child_process";
import fs from "node:fs";

if (!fs.existsSync("./data/plugins/Thorium Default")) {
	console.info(
		execSync(
			'git clone https://github.com/thorium-sim/thorium-nova-plugin "data/plugins/Thorium Default"',
		).toString(),
	);
} else {
	console.info(
		execSync("git pull", {
			cwd: "./data/plugins/Thorium Default",
		}).toString(),
	);
}
