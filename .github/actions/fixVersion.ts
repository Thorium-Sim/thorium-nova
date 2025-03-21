import { appendFile } from "node:fs/promises";
import path from "node:path";

try {
	const pkgjsonPath = path.join(process.cwd(), "./package.json");
	const configPath = path.join(
		process.cwd(),
		"../kiosk/src-tauri",
		"tauri.conf.json",
	);
	const pkgJson = await Bun.file(pkgjsonPath).json();
	const config = await Bun.file(configPath).json();
	const version = pkgJson.version.replace("alpha.", "");

	console.log("package.json path:", pkgjsonPath);
	console.log("tauri config path:", configPath);
	console.log("package.json version:", pkgJson.version);
	console.log("new version:", version);
	// Write to GITHUB_OUTPUT environment file
	const outputFile = process.env.GITHUB_OUTPUT!;
	await appendFile(outputFile, `version=${pkgJson.version}\n`);

	// Replace it in the Cargo.toml and tauri.conf.json files
	const cargoPath = path.join(
		process.cwd(),
		"../kiosk/src-tauri",
		"Cargo.toml",
	);
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
