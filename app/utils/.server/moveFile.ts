import { mkdir, rename } from "node:fs/promises";
import path from "node:path";

import { DataStore } from "@thorium/utils/.server/db-fs";

export async function moveFile(file: Blob | File | string, filePath: string, assetPath: string) {
	const thoriumPath = DataStore.operations.getStore()!.thoriumPath;
	await mkdir(path.join(thoriumPath, assetPath), {
		recursive: true,
	});
	const writePath = path.join(thoriumPath, assetPath, filePath);

	if (typeof file === "string") {
		await rename(file, writePath);
	} else {
		await Bun.write(Bun.file(writePath), file);
	}
	return path.join(assetPath, filePath);
}
