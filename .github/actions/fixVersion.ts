import { appendFile } from "node:fs/promises";
import path from "node:path";

try {
	const configPath = path.join(process.cwd(), "src-tauri", "tauri.conf.json");
	const config = await Bun.file(configPath).json();
	const version = config.version.replace("alpha.", "");

	// Write to GITHUB_OUTPUT environment file
	const outputFile = process.env.GITHUB_OUTPUT!;
	await appendFile(outputFile, `version=${config.version}\n`);

	// Replace it in the Cargo.toml and tauri.conf.json files
	const cargoPath = path.join(process.cwd(), "src-tauri", "Cargo.toml");
	await Bun.write(
		configPath,
		(await Bun.file(configPath).text()).replace(config.version, version),
	);
	await Bun.write(
		cargoPath,
		(await Bun.file(cargoPath).text()).replace(config.version, version),
	);
} catch (error) {
	console.error("Error processing version:", error);
	process.exit(1);
}
