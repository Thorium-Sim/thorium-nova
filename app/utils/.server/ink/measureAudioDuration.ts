import { parseBlob } from "music-metadata";

export async function measureAudioDurationMs(filePath: string) {
	const fileStream = Bun.file(filePath);
	const metadata = await parseBlob(fileStream, {
		duration: true,
		skipCovers: true,
		skipPostHeaders: true,
	});
	if (!metadata.format.duration) return 0;
	return metadata.format.duration * 1000;
}
