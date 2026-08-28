import { setDefaultResultOrder } from "node:dns";

import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import { iconsSpritesheet } from "vite-plugin-icons-spritesheet";

import { componentDocs } from "./scripts/componentDocs";
import remarkMdxImages from "./scripts/remark-mdx-images";
// import { analyzer } from "vite-bundle-analyzer";
// import Inspect from "vite-plugin-inspect";

setDefaultResultOrder("ipv4first");

const port = Number(process.env.PORT) || 3000;

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		tailwindcss(),
		// Inspect(),
		// analyzer(),
		mdx({
			remarkPlugins: [
				remarkFrontmatter,
				remarkMdxFrontmatter,
				// @ts-ignore
				remarkMdxImages,
			],
			rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, [rehypeShiki, { theme: "one-dark-pro" }]],
		}),
		iconsSpritesheet({
			// Defaults to false, should it generate TS types for you
			withTypes: true,
			// The path to the icon directory
			inputDir: "app/icons",
			// Output path for the generated spritesheet and types
			outputDir: "app/components/ui/icons",
			// Output path for the generated type file, defaults to types.ts in outputDir
			typesOutputFile: "app/components/ui/icons/name.d.ts",
			// The path to the formatter config file, defaults to no path
			// pathToFormatterConfig: "./biome.json",
			iconNameTransformer: (name) => name,
		}),
		reactRouter(),
		componentDocs(),
	],
	build: {
		outDir: "../build",
		emptyOutDir: true,
		rollupOptions: {
			onwarn: () => {},
		},
	},

	base: "/",
	server: {
		port,
		host: "0.0.0.0",
		open: process.env.NODE_ENV !== "test",
		hmr: {
			path: "/vite-hmr",
		},
		fs: {
			strict: false,

			// Allow serving files from one level up to the project root
			allow: [".."],
		},
		proxy: {
			"/netSend": `http://localhost:${port + 1}`,
			"/netRequest": `http://localhost:${port + 1}`,
			"/plugins": `http://localhost:${port + 1}`,
			"/flights": `http://localhost:${port + 1}`,
			"/ws": {
				target: `ws://localhost:${port + 1}`,
				ws: true,
			},
		},
	},
});
