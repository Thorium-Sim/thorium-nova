import { execSync } from "child_process";
import fs from "fs";

if (!fs.existsSync("./data/plugins/Thorium Default")) {
	console.info(
		execSync(
			'git clone https://github.com/thorium-sim/thorium-prime-plugin "data/plugins/Thorium Default"',
		).toString(),
	);
} else {
	console.info(
		execSync("git pull", {
			cwd: "./data/plugins/Thorium Default",
		}).toString(),
	);
}