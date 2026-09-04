import type { ElectrobunConfig } from "electrobun";

import packageJson from "./package.json";

export default {
	app: {
		name: "Thorium Nova",
		identifier: "com.thoriumsim.nova",
		version: packageJson.version,
	},
	build: {
		cottontail: {
			entrypoint: "desktop/index.ts",
		},
		views: {
			mainview: {
				entrypoint: "desktop/web/index.ts",
			},
		},
		copy: {
			"desktop/web/index.html": "views/mainview/index.html",
			"binaries/thorium-nova-server": "thorium-nova-server",
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
