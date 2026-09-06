import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function unzip(zipPath: string, extractFolder: string) {
	const data = await Bun.file(zipPath).bytes();
	const archive = new Bun.Archive(data); // gzip is auto-detected
	await archive.extract(extractFolder);
}

export async function zip(
	folderPath: string,
	zipPath: string,
	options?: { ignoreFiles?: string[] },
) {
	const files: Record<string, Uint8Array> = {};

	async function walk(dir: string, prefix = "") {
		const entries = await readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			if (options?.ignoreFiles?.includes(entry.name)) continue;

			const fullPath = join(dir, entry.name);
			const archivePath = prefix ? `${prefix}/${entry.name}` : entry.name;

			if (entry.isDirectory()) {
				await walk(fullPath, archivePath);
			} else {
				files[archivePath] = await Bun.file(fullPath).bytes();
			}
		}
	}

	await walk(folderPath);

	const archive = new Bun.Archive(files, { compress: "gzip" });
	await Bun.write(zipPath, archive);
}
