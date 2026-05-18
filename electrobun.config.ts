import fs from "fs";
import path from "path";

import type { BunPlugin } from "bun";
import type { ElectrobunConfig } from "electrobun";

import packageJson from "./package.json";

export function resolvePath(importPath: string) {
	if (importPath.startsWith("@thorium/ui/")) {
		let filePath = path.join(
			import.meta.dirname,
			importPath.replace("@thorium/ui/", "app/components/ui/"),
		);
		if (path.extname(filePath) === "") {
			filePath = addExtension(filePath);
		}
		return { path: filePath };
	} else if (importPath.startsWith("@thorium/")) {
		let filePath = path.join(import.meta.dirname, importPath.replace("@thorium/", "app/"));
		if (path.extname(filePath) === "" || path.extname(filePath) === ".server") {
			filePath = addExtension(filePath);
		}
		return { path: filePath };
	}
	return undefined;
}

function addExtension(filePath: string) {
	if (fs.existsSync(`${filePath}/index.ts`)) return `${filePath}/index.ts`;
	if (fs.existsSync(`${filePath}/index.tsx`)) return `${filePath}/index.tsx`;
	if (fs.existsSync(`${filePath}.ts`)) return `${filePath}.ts`;
	if (fs.existsSync(`${filePath}.tsx`)) return `${filePath}.tsx`;
	return filePath;
}

function bunTsconfigPaths(): BunPlugin {
	return {
		name: "bun-tsconfig-paths",
		setup(build) {
			build.onResolve({ filter: /.*/, namespace: "file" }, (args) => {
				return resolvePath(args.path);
			});
		},
	};
}

export default {
	app: {
		name: "Thorium Nova",
		identifier: "com.thoriumsim.nova",
		version: packageJson.version,
	},
	build: {
		bun: {
			entrypoint: "desktop/index.ts",
			external: ["@msgpack/msgpack", "pdfkit"],
			plugins: [bunTsconfigPaths()],
			// tsconfig: "./tsconfig.json",
		},
		// views: {
		// 	mainview: {
		// 		entrypoint: "mainview/index.ts",
		// 		external: [],
		// 	},
		// },
		copy: {
			"external-deps/node_modules": "bun/node_modules",
		},
		mac: {
			bundleCEF: false,
			codesign: true,
			notarize: true,
			entitlements: {},
			icons: "scripts/Icon.icon",
		},
		linux: {
			bundleCEF: false,
			icon: "scripts/icon.png",
		},
		win: {
			bundleCEF: false,
			icon: "scripts/icon.png",
		},
	},
	release: {
		baseUrl: "https://github.com/thorium-sim/thorium-nova/releases/latest/download",
	},
} satisfies ElectrobunConfig;
