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

		const name = await file.slice(startByte, startByte + nameLength).text();
		startByte += nameLength;

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

export async function getSSLCert() {
	// @ts-expect-error
	await import("../../.server/server.cert", {
		with: { type: "file" },
	});
	// @ts-expect-error
	await import("../../.server/server.key", {
		with: { type: "file" },
	});

	const certFile = embeddedFiles.find(
		// @ts-expect-error Bun adds the file name
		(file) => file.name === "server.cert",
	);
	const keyFile = embeddedFiles.find(
		// @ts-expect-error Bun adds the file name
		(file) => file.name === "server.key",
	);

	return { certFile, keyFile };
}
