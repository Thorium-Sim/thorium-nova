import { promises as fs } from "node:fs";
import path from "node:path";
import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { unzip } from "@thorium/utils/.server/zip";

export async function initDefaultPlugin() {
	if (process.env.NODE_ENV !== "production") return;

	await fs.mkdir(path.join(thoriumPath, "plugins"), { recursive: true });
	const tempPath = await fs.mkdtemp("thorium-nova");
	const tempFile = path.join(tempPath, "defaultPlugin.plug");

	const defaultPlugin = await import(
		// @ts-expect-error
		"../../../build/defaultPlugin.plug",
		// @ts-expect-error
		{
			with: { type: "file" },
		}
	);

	try {
		// Initialize the default plugin
		await Bun.write(tempFile, Bun.file(defaultPlugin.default));

		await unzip(tempFile, path.join(thoriumPath, "plugins/Thorium Default"));
		await fs.rm(tempPath, { recursive: true, force: true });
	} catch (e) {
		console.error(e);
		await fs.rm(thoriumPath, { recursive: true, force: true });
		await fs.rm(tempPath, { recursive: true, force: true });
		throw new Error("Error installing default plugins.");
	}
}
