import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { flatRoutes } from "remix-flat-routes";
import { setDefaultResultOrder } from "node:dns";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkMdxImages from "./remark-mdx-images";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import { iconsSpritesheet } from "vite-plugin-icons-spritesheet";

setDefaultResultOrder("ipv4first");

export default defineConfig({
	plugins: [
		mdx({
			remarkPlugins: [
				remarkFrontmatter,
				remarkMdxFrontmatter,
				// @ts-ignore
				remarkMdxImages,
			],
			rehypePlugins: [
				rehypeSlug,
				rehypeAutolinkHeadings,
				[rehypeShiki, { theme: "one-dark-pro" }],
			],
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
			// What formatter to use to format the generated files, prettier or biome, defaults to no formatter
			formatter: "biome",
			// The path to the formatter config file, defaults to no path
			pathToFormatterConfig: "../biome.json",
			iconNameTransformer: (name) => name,
		}),
		remix({
			ssr: false,
			buildDirectory: "../dist/public",

			ignoredRouteFiles: ["**/*"],
			routes: async (defineRoutes) => {
				return flatRoutes("routes", defineRoutes);
			},
		}),
		tsconfigPaths(),
	],
	build: {
		outDir: "../dist/public",
		emptyOutDir: false,
		rollupOptions: {
			onwarn: (warning, warn) => {},
		},
	},

	define: {
		"process.env.THORIUMSIM_CLIENT_ID": `"01FM3JNPNP3GFAXYR22Y7F9XAJ"`,
		"process.env.THORIUMSIM_URL": `"https://thoriumsim.com"`,
	},
	base: "/",
	server: {
		port: 3000,
		host: "0.0.0.0",
		open: true,
		fs: {
			strict: false,

			// Allow serving files from one level up to the project root
			allow: [".."],
		},
		proxy: {
			"/netSend": "http://localhost:3001",
			"/netRequest": "http://localhost:3001",
			"/plugins": "http://localhost:3001",
			"/ws": {
				target: "ws://localhost:3001/ws",
				ws: true,
			},
		},
	},
});
