import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { zip } from "@thorium/utils/.server/zip";
import { execSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const ignoreFiles = [".git", ".DS_Store"];

await mkdir("./build", { recursive: true });

console.info("Zipping default plugin");
await zip(
	path.join(thoriumPath, "plugins/Thorium Default"),
	path.join("./build/defaultPlugin.plug"),
	{ ignoreFiles },
);
console.info("Bundling client assets");
// Bundle all of the client assets into a single JS file
const clientAssetsFile = Bun.file("./build/clientBundle.dat");
const writer = clientAssetsFile.writer();
const glob = new Bun.Glob("**/*");
for await (const filename of glob.scan({
	cwd: "./build/client",
	onlyFiles: true,
})) {
	const nameLength = new Uint8Array([filename.length]);
	writer.write(nameLength);
	writer.write(filename);
	const file = Bun.file(path.resolve("./build/client", filename));
	const contentLength = new Uint32Array([file.size]);
	writer.write(contentLength);
	writer.write(await file.arrayBuffer());
}
writer.end();

console.info("Bundling server");
// We have to run this next command using a shell since the --compile flag doesn't work with the Bun API.
execSync(
	`bun build --minify --define 'process.env.NODE_ENV="production"' --sourcemap --outfile build/bunServer --compile ./app/server.ts`,
);

console.info("Cleaning up");
await rm(path.join("./build/defaultPlugin.plug"));
await rm(path.join("./build/client"), { force: true, recursive: true });
await rm(path.join("./build/clientBundle.dat"));
