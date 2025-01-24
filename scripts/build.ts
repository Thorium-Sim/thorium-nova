import type { BunPlugin } from "bun";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import tailwindConfig from "../tailwind.config";
const styleFilter = /.\.(css)$/;

const cssPlugin: BunPlugin = {
	name: "CSS Loader",
	setup(build) {
		build.onLoad({ filter: styleFilter }, async (args) => {
			const css = await Bun.file(args.path).text();
			const result = await postcss([tailwindcss(tailwindConfig)]).process(css, {
				from: args.path,
			});

			return {
				contents: result.css,
				loader: "file",
			};
		});
	},
};
console.log(
	await Bun.build({
		entrypoints: ["./app/client.tsx"],
		html: true,
		outdir: "./build",
		minify: false,
		experimentalCss: true,

		plugins: [cssPlugin],
	}),
);
