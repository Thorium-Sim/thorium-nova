import { promises as fs } from "node:fs";
import path from "node:path";

import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { unzip } from "@thorium/utils/.server/zip";
import { embeddedFiles } from "bun";
import { readdir } from "node:fs/promises";

export async function initDefaultPlugin() {
	if (process.env.NODE_ENV !== "production") return;

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
		if (embeddedFiles.length === 0) {
			const filename = (await readdir(import.meta.dirname)).find(
				(f) => f.startsWith("clientBundle") && f.endsWith(".dat"),
			);
			if (!filename)
				throw new Error("Client assets are not bundled for an unknown reason");
			await Bun.write(
				tempFile,
				Bun.file(path.join(import.meta.dirname, filename)),
			);
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
