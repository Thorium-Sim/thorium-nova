import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Thorium Nova",
		identifier: "com.thoriumsim.nova",
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
		copy: {},
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
