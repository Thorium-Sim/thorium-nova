import { appendFile } from "node:fs/promises";
import path from "node:path";

try {
	const pkgjsonPath = path.join(process.cwd(), "./package.json");
	const pkgJson = await import(pkgjsonPath, { with: { type: "json" } });

	console.info("package.json path:", pkgjsonPath);
	console.info("package.json version:", pkgJson.version);
	// Write to GITHUB_OUTPUT environment file
	const outputFile = process.env.GITHUB_OUTPUT!;
	await appendFile(outputFile, `version=${pkgJson.version}\n`);
} catch (error) {
	console.error("Error processing version:", error);
	process.exit(1);
}
