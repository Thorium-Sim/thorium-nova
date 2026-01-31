import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Thorium Nova",
		identifier: "com.thoriumsim.nova",
		version: "0.0.1",
	},
	build: {
		useAsar: true,
		bun: {
			entrypoint: "desktop/desktop.ts",
			external: [],
		},
		// views: {
		//   mainview: {
		//     entrypoint: "src/mainview/index.ts",
		//     external: [],
		//   },
		// },
		copy: {
			"src/mainview/index.html": "views/mainview/index.html",
			"src/mainview/index.css": "views/mainview/index.css",
			"assets/tray-icon.png": "views/assets/tray-icon.png",
		},
		mac: {
			codesign: true,
			notarize: false,
			bundleCEF: false,
			entitlements: {},
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
