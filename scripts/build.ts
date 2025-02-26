import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { zip } from "@thorium/utils/.server/zip";
import { exec, type ExecException } from "node:child_process";
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
const platformMap = {
	"aarch64-apple-darwin": "bun-darwin-arm64",
	// Bun doesn't support arm on Windows yet, so we'll hope emulation works
	"aarch64-pc-window-msvc": "bun-windows-x64",
	"aarch64-unknown-linux-gnu": "bun-linux-arm64",
	"x86_64-pc-windows-msvc": "bun-windows-x64",
	"x86_64-unknown-linux-gnu": "bun-linux-x64",
	"x86_64-apple-darwin": "bun-darwin-x64",
};

const targetArch =
	process.arch === "arm64"
		? "aarch64"
		: process.arch === "x64"
			? "x86_64"
			: "unknown";
const targetPlatform =
	process.platform === "darwin"
		? "apple-darwin"
		: process.platform === "linux"
			? "unknown-linux-gnu"
			: process.platform === "win32"
				? "pc-windows-msvc"
				: "unknown";

const arch = (process.env.BUILD_ARCH ||
	`${targetArch}-${targetPlatform}`) as keyof typeof platformMap;

// We have to run this next command using a shell since the --compile flag doesn't work with the Bun API.
const command = `bun build --minify --define "process.env.NODE_ENV='production'" --asset-naming="[name].[ext]" --target=TARGET --sourcemap --outfile ./src-tauri/binaries/thoriumNovaServer-ARCH --compile ./app/server.ts ./node_modules/@thorium-sim/rapier3d-node/dist/rapier_wasm3d_bg.wasm`;
const target = platformMap[arch];
if (!target) {
	throw new Error(
		`Invalid arch or platform. Arch: ${process.arch}, Platform: ${process.platform}.`,
	);
}
await new Promise<void>((res, rej) =>
	exec(
		command.replace("TARGET", target).replace("ARCH", arch),
		(err: ExecException | null) => (err ? rej(err) : res()),
	),
);

console.info("Cleaning up");
await rm(path.join("./build"), { force: true, recursive: true });
