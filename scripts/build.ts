import { mkdir } from "node:fs/promises";
import path from "node:path";

import { getThoriumPath } from "@thorium/utils/.server/appPaths";
import { zip } from "@thorium/utils/.server/zip";
import { $ } from "bun";

const ignoreFiles = [".git", ".DS_Store"];
const thoriumPath = getThoriumPath("development");

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
await writer.end();

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
	process.arch === "arm64" ? "aarch64" : process.arch === "x64" ? "x86_64" : "unknown";
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
await Promise.all([
	Bun.build({
		entrypoints: [
			"./desktop/exe.ts",
			"./node_modules/@thorium-sim/rapier3d-node/dist/rapier_wasm3d_bg.wasm",
		],
		compile: {
			autoloadBunfig: false,
			autoloadDotenv: false,
			autoloadPackageJson: false,
			autoloadTsconfig: false,
			windows: {
				hideConsole: false,
				title: "Thorium Nova",
				description: "Starship bridge simulator.",
				icon: "./desktop/icons/icon.ico",
			},
			outfile: `./binaries/thorium-nova-server-${arch}${arch.includes("pc-windows") ? ".exe" : ""}`,
		},
		naming: {
			asset: "[name].[ext]", // equivalent to --asset-naming="[name].[ext]"
		},
		bytecode: true,
		sourcemap: true,
		minify: true,
		define: {
			"process.env.NODE_ENV": "'production'",
		},
		target: "bun",
	}),
	Bun.build({
		entrypoints: [
			"./desktop/index.tsx",
			"./desktop/exe.ts",
			"./node_modules/@thorium-sim/rapier3d-node/dist/rapier_wasm3d_bg.wasm",
		],
		compile: {
			autoloadBunfig: false,
			autoloadDotenv: false,
			autoloadPackageJson: false,
			autoloadTsconfig: false,
			windows: {
				hideConsole: true,
				title: "Thorium Nova",
				description: "Starship bridge simulator.",
				icon: "./desktop/icons/icon.ico",
			},
			outfile: `./binaries/thorium-nova-server-windowed-${arch}${arch.includes("pc-windows") ? ".exe" : ""}`,
		},
		naming: {
			asset: "[name].[ext]", // equivalent to --asset-naming="[name].[ext]"
		},
		bytecode: true,
		sourcemap: true,
		minify: true,
		define: {
			"process.env.NODE_ENV": "'production'",
		},
		target: "bun",
	}),
]);
// Clean up the unneeded source maps in the binary folder
await $`rm binaries/*.map`;

console.info("Server compiled to ", path.resolve(`./binaries/thorium-nova-server-${arch}`));
