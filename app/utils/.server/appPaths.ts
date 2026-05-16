import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getThoriumPath(env: string) {
	let __dirname =
		env === "production"
			? path.join(fileURLToPath(import.meta.url), "../..")
			: process.env.IS_KIOSK
				? path.join(fileURLToPath(import.meta.url), "../../../../../../../..")
				: path.join(fileURLToPath(import.meta.url), "../../../..");

	__dirname = __dirname.replaceAll("%20", " ");

	let thoriumPath = path.join(__dirname, "data");
	/* istanbul ignore next */
	if (env === "production") {
		/* istanbul ignore next */
		if (!fs.existsSync(`${os.homedir()}/Documents`)) {
			/* istanbul ignore next */
			fs.mkdirSync(`${os.homedir()}/Documents`, { recursive: true });
		}
		thoriumPath = path.join(os.homedir(), `/Documents/thorium-nova`);
	}
	/* istanbul ignore next */
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

	/* format path to function with windows machines */
	thoriumPath = thoriumPath.replaceAll("\\", "/");

	return thoriumPath;
}
