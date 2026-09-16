import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const home = os.homedir();
const platform = process.platform;

const appData = (() => {
	if (platform === "darwin") return path.join(home, "Library", "Application Support");
	if (platform === "win32") return process.env.APPDATA || path.join(home, "AppData", "Roaming");
	// linux / other
	return process.env.XDG_CONFIG_HOME || path.join(home, ".config");
})();

export function getThoriumPath(env: string) {
	let __dirname =
		env === "production"
			? path.join(fileURLToPath(import.meta.url), "../..")
			: process.env.IS_KIOSK
				? path.join(fileURLToPath(import.meta.url), "../../../../../../../..")
				: path.join(fileURLToPath(import.meta.url), "../../../..");

	__dirname = __dirname.replaceAll("%20", " ");

	let thoriumPath = path.join(__dirname, "data");

	if (env === "production") {
		thoriumPath = path.join(appData, "thorium-nova");
	}

	if (process.env.THORIUM_PATH) {
		let testPath = String(process.env.THORIUM_PATH).replace("~", os.homedir());
		if (testPath.startsWith("/")) testPath = path.join(__dirname, testPath);
		try {
			fs.mkdirSync(path.join(testPath, "plugins"), { recursive: true });
			fs.mkdirSync(path.join(testPath, "flights"), { recursive: true });
			thoriumPath = testPath;
		} catch {
			// Do nothing.
		}
	}

	fs.mkdirSync(thoriumPath, { recursive: true });

	/* format path to function with windows machines */
	thoriumPath = thoriumPath.replaceAll("\\", "/");

	return thoriumPath;
}
