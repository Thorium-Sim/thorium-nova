import { copyFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";

import { $ } from "bun";

import packageJson from "../package.json" with { type: "json" };

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

if (process.platform === "darwin") {
	console.info("Building the app bundle for the windowed macOS app");
	let plist = await Bun.file("./desktop/Info.plist").text();
	plist.replace("{{VERSION}}", packageJson.version);

	await mkdir("./artifacts/Thorium Nova.app/Contents/MacOS", { recursive: true });
	await mkdir("./artifacts/Thorium Nova.app/Contents/Resources", { recursive: true });
	await Promise.all([
		Bun.write("./artifacts/Thorium Nova.app/Contents/Info.plist", plist),
		rename(
			`./binaries/thorium-nova-server-windowed-${arch}`,
			"./artifacts/Thorium Nova.app/Contents/MacOS/launcher",
		),
		copyFile(
			"./desktop/icons/AppIcon.icns",
			"./artifacts/Thorium Nova.app/Contents/Resources/AppIcon.icns",
		),
	]);
	console.info("Signing and notarizing");
	await Promise.all([
		signBinary(`./binaries/thorium-nova-server-${arch}`).then(() =>
			notarizeBinary(`./binaries/thorium-nova-server-${arch}`),
		),
		signApp(),
	]);

	console.info("Done");
}

async function signBinary(filepath: string) {
	await $`codesign -s "$APPLE_DEVELOPER_ID" -f --timestamp --entitlements ./desktop/Entitlements.plist -o runtime "${filepath}"`;
}
async function notarizeBinary(filepath: string) {
	const zipPath = `${path.parse(filepath).name}.zip`;
	await $`ditto -c -k --keepParent ${filepath} ${zipPath}`;
	await $`xcrun notarytool submit "${zipPath}" \
  --keychain-profile "notarytool-password" \
  --wait`;
	if (filepath.endsWith(".app")) {
		console.info(`Stapling ${filepath}`);
		await $`xcrun stapler staple "${filepath}"`;
	}
	await $`rm "${zipPath}"`;
}

async function signApp() {
	await signBinary("./artifacts/Thorium Nova.app/Contents/MacOS/launcher");
	await signBinary("./artifacts/Thorium Nova.app");
	await notarizeBinary("./artifacts/Thorium Nova.app");
	await makeDmg();
}

async function makeDmg() {
	console.info("Making DMG");
	await $`create-dmg \
    --volname "Thorium Nova" \
    --volicon "desktop/icons/AppIcon.icns" \
    --background "desktop/backgrounds/dmg-background.tiff" \
    --window-pos 200 120 \
    --window-size 640 520 \
    --icon-size 100 \
    --icon "Thorium Nova.app" 192 344 \
    --hide-extension "Thorium Nova.app" \
    --app-drop-link 448 344 \
    --codesign "$APPLE_DEVELOPER_ID" \
    --notarize "notarytool-password" \
    --overwrite \
    "binaries/Thorium Nova-${process.arch}.dmg" \
    "artifacts/"`;
}
