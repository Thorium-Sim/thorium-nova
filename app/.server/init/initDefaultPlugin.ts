import { promises as fs } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { thoriumContext } from "@thorium/utils/.server/context";
import { unzip } from "@thorium/utils/.server/zip";
import { embeddedFiles } from "bun";

export async function initDefaultPlugin(isProd: boolean) {
	if (!isProd) return;
	const thoriumPath = thoriumContext.getStore()!.thoriumPath;
	await fs.mkdir(path.join(thoriumPath, "plugins"), { recursive: true });
	const tempPath = await fs.mkdtemp("thorium-nova");
	const tempFile = path.join(tempPath, "defaultPlugin.plug");

	// This is just necessary to embed the plugin, but we don't reference it this way.
	await import(
		// @ts-expect-error
		"../../../build/defaultPlugin.plug",
		{
			with: { type: "file" },
		}
	);
	try {
		// Initialize the default plugin
		const devPluginPath = path.join(import.meta.dirname, "../../../build");
		if (embeddedFiles.length === 0) {
			const filename = (await readdir(devPluginPath)).find(
				(f) => f.startsWith("defaultPlugin") && f.endsWith(".plug"),
			);
			if (!filename) throw new Error("Default Plugin is not bundled for an unknown reason");
			await Bun.write(tempFile, Bun.file(path.join(devPluginPath, filename)));
		} else {
			await Bun.write(
				tempFile,
				// @ts-expect-error Bun adds the file name
				embeddedFiles.find((file) => file.name === "defaultPlugin.plug")!,
			);
		}

		await unzip(tempFile, path.join(thoriumPath, "plugins/Thorium Default"));
		await fs.rm(tempPath, { recursive: true, force: true });
	} catch (e) {
		console.error(e);
		await fs.rm(thoriumPath, { recursive: true, force: true });
		await fs.rm(tempPath, { recursive: true, force: true });
		throw new Error("Error installing default plugins.");
	}
}
