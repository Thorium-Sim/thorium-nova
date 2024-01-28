import {unstable_vitePlugin as remix} from "@remix-run/dev";
import {defineConfig} from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import {flatRoutes} from "remix-flat-routes";
import {setDefaultResultOrder} from "dns";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkMdxImages from "remark-mdx-images";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
setDefaultResultOrder("ipv4first");

export default defineConfig({
  plugins: [
    remix({
      unstable_ssr: false,
      assetsBuildDirectory: "../dist/public",
      serverBuildDirectory: "../dist/server",
      ignoredRouteFiles: ["**/*"],
      routes: async defineRoutes => {
        return flatRoutes("routes", defineRoutes);
      },
    }),
    // @ts-expect-error
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkMdxImages],
      rehypePlugins: [
        rehypeSlug,
        rehypeAutolinkHeadings,
        [rehypeShiki, {theme: "one-dark-pro"}],
      ],
    }),
    // @ts-expect-error
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
