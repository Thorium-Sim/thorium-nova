import {defineConfig} from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import releasesPlugin from "./vite-plugins/releases";
import mdPlugin, {Mode} from "vite-plugin-markdown";

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const markdownIt = await import("markdown-it");
  const anchor = await import("markdown-it-anchor");
  const md = markdownIt.default();
  md.use(anchor.default, {
    permalink: anchor.default.permalink.linkAfterHeader({
      style: "visually-hidden",
      assistiveText: title => `Permalink to “${title}”`,
      visuallyHiddenClass: "sr-only",
      wrapper: ['<div class="header-permalink">', "</div>"],
    }),
  });
  return {
    plugins: [
      tsconfigPaths(),
      react(),
      releasesPlugin(),
      mdPlugin({
        mode: [Mode.HTML, Mode.TOC],
        markdownIt: md,
      }),
    ],
    build: {
      outDir: "../dist/public",
      emptyOutDir: false,
      commonjsOptions: {include: []},
    },
    optimizeDeps: {
      disabled: false,
    },
    define: {
      "process.env.THORIUMSIM_CLIENT_ID": `"01FM3JNPNP3GFAXYR22Y7F9XAJ"`,
      "process.env.THORIUMSIM_URL": `"https://thoriumsim.com"`,
    },
    base: "/",
    server: {
      port: 3000,
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
      },
    },
  };
});
