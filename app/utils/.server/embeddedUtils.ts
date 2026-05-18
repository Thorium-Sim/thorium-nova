import { readdir } from "node:fs/promises";
import path from "node:path";

import { embeddedFiles } from "bun";
import { getMimeType } from "hono/utils/mime";

export async function getClientBundleFile(filePath: string) {
	// @ts-expect-error
	await import("../../../build/clientBundle.dat", {
		with: { type: "file" },
	});
	let file: Bun.BunFile;
	if (embeddedFiles.length > 0) {
		// @ts-expect-error Bun adds the file name
		file = embeddedFiles.find((file) => file.name === "clientBundle.dat")!;
	} else {
		const filename = (await readdir(import.meta.dirname)).find(
			(f) => f.startsWith("clientBundle") && f.endsWith(".dat"),
		);
		if (!filename) throw new Error("Client assets are not bundled for an unknown reason");
		file = Bun.file(path.join(import.meta.dirname, filename));
	}

	let startByte = 0;
	while (startByte < file.size) {
		const nameLength = await file
			.slice(startByte, startByte + 1)
			.arrayBuffer()
			.then((buffer) => new Uint8Array(buffer)[0]);
		startByte += 1;

		let name = await file.slice(startByte, startByte + nameLength).text();
		startByte += nameLength;

		// On Windows, the file paths are stored using \, but the URL paths are /
		name = name.replaceAll(path.sep, path.posix.sep);

		const fileSize = await file
			.slice(startByte, startByte + 4)
			.arrayBuffer()
			.then((buffer) => new Uint32Array(buffer)[0]);
		startByte += 4;

		if (name === filePath) {
			const mimeType = getMimeType(name);
			return {
				file: file.slice(startByte, startByte + fileSize, mimeType),
				name,
			};
		}
		startByte += fileSize;
	}

	return null;
}
