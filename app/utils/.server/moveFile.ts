import path from "node:path";
import { mkdir, rename } from "node:fs/promises";
import { thoriumPath } from "@thorium/utils/.server/appPaths";

export async function moveFile(
	file: Blob | File | string,
	filePath: string,
	assetPath: string,
) {
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
