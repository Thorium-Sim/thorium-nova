import { readdir, lstat } from "node:fs/promises";
import path from "node:path";

import type { FileOrFolder } from "@thorium/.server/data/thorium";

export async function traverseFiles(basePath: string, rootPath: string, extensions: string[] = []) {
	const files: FileOrFolder[] = [];
	try {
		const folderFiles = await readdir(basePath);
		for (const file of folderFiles) {
			if (file.includes(".DS_Store")) continue;
			const filePath = path.join(basePath, file);
			try {
				const isDirectory = (await lstat(filePath)).isDirectory();
				if (isDirectory) {
					files.push({
						name: file,
						fullPath: filePath.replace(rootPath, ""),
						contents: await traverseFiles(filePath, rootPath, extensions),
					});
				} else if (
					!extensions ||
					extensions.length === 0 ||
					extensions.includes(path.extname(filePath).replace(".", ""))
				) {
					files.push({
						name: file,
						fullPath: filePath.replace(rootPath, ""),
						contents: null,
					});
				}
			} catch {}
		}
	} catch {}

	// Traverse again to sort and filter
	return sortFiles(files);
}
function sortFiles(files: FileOrFolder[]) {
	const output: FileOrFolder[] = [];
	for (const file of files) {
		if (Array.isArray(file.contents)) {
			if (file.contents.length === 0) continue;
			file.contents = sortFiles(file.contents);
		}
		output.push(file);
	}
	return output.sort((a, b) => (a.name > b.name ? 1 : -1));
}
