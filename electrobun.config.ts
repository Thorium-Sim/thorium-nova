import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "photo-booth",
		identifier: "photobooth.electrobun.dev",
		version: "0.0.1",
	},
	build: {
		bun: {
			entrypoint: "desktop/index.ts",
			external: [],
			tsconfig: "./tsconfig.json",
		},
		// views: {
		// 	mainview: {
		// 		entrypoint: "mainview/index.ts",
		// 		external: [],
		// 	},
		// },
		copy: {
			"build/clientBundle.dat": "clientBundle.dat",
		},
		mac: {
			bundleCEF: false,
			codesign: false,
			notarize: false,
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
