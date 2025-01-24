import fs, { createWriteStream, createReadStream } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import tar from "tar-stream";

export async function unzip(zipPath: string, extractFolder: string) {
	return new Promise<void>((res, oops) => {
		const readStream = createReadStream(zipPath);
		const gunzip = zlib.createGunzip();
		const parser = tar.extract();

		// Set up event listeners for the parser
		parser.on("entry", (header, stream, next) => {
			// Handle each entry in the tarball

			// Ensure the entry is within the extract folder to avoid extracting outside
			const entryPath = `${extractFolder}/${header.name}`;

			// Create directories if they don't exist
			if (header.type === "directory") {
				fs.mkdirSync(entryPath, { recursive: true });
				next();
			} else {
				// Create a write stream for the file
				const writeStream = createWriteStream(entryPath);

				// Pipe the entry stream to the file
				stream.pipe(writeStream);

				// Continue to the next entry once the file is written
				stream.on("end", next);
			}
		});

		readStream.pipe(gunzip).pipe(parser);

		// Handle the end of the process
		parser.on("finish", () => {
			res();
		});

		// Handle errors during extraction
		parser.on("error", (err) => {
			oops(err);
		});
	});
}

export async function zip(
	folderPath: string,
	zipPath: string,
	options?: { ignoreFiles?: string[] },
) {
	return new Promise<void>((res, oops) => {
		// Create a tar packer
		const pack = tar.pack();

		// Create a gzip stream
		const gzip = zlib.createGzip();

		// Create a write stream for the output tarball
		const writeStream = fs.createWriteStream(zipPath);

		// Set up event listeners for the packer
		// pack.entry({ name: path.basename(folderPath), type: "directory" });

		// Function to recursively add entries to the tarball
		const addFolderToTarball = (folderPath: string, entryPrefix = "") => {
			const entries = fs.readdirSync(folderPath);

			for (const entry of entries) {
				if (options?.ignoreFiles?.includes(entry)) continue;
				const entryPath = path.join(folderPath, entry);
				const entryName = path.join(entryPrefix, entry);

				const stat = fs.statSync(entryPath);

				if (stat.isDirectory()) {
					pack.entry({ name: entryName, type: "directory" });
					addFolderToTarball(entryPath, entryName);
				} else {
					const fileContent = fs.readFileSync(entryPath);
					pack.entry({ name: entryName, size: stat.size }, fileContent);
				}
			}
		};

		// Add the contents of the source folder to the tarball
		addFolderToTarball(folderPath);

		// Finalize the tarball
		pack.finalize();

		// Pipe the tarball through the gzip stream and then through the write stream
		pack.pipe(gzip).pipe(writeStream);

		// Handle the end of the process
		writeStream.on("finish", () => {
			res();
		});

		// Handle errors during compression
		writeStream.on("error", (err) => {
			oops(err);
		});
	});
}
