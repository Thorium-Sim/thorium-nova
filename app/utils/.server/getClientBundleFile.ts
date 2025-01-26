import { getMimeType } from "hono/utils/mime";

export async function getClientBundleFile(filePath: string) {
	// @ts-expect-error
	const clientBundle = await import("../../../build/clientBundle.dat", {
		with: { type: "file" },
	});
	const file = Bun.file(clientBundle.default);

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
