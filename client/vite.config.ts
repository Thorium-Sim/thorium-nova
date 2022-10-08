import {defineConfig} from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import tsconfigPaths from "vite-tsconfig-paths";
import reactJsx from "vite-react-jsx";
import releasesPlugin from "./vite-plugins/releases";
import mdPlugin, {Mode} from "vite-plugin-markdown";

// https://vitejs.dev/config/
export default defineConfig(async () => {
  return {
    plugins: [
      reactRefresh(),
      tsconfigPaths(),
      reactJsx(),
      releasesPlugin(),
      mdPlugin({mode: [Mode.HTML, Mode.TOC]}),
    ],
    build: {
      outDir: "../dist/public",
      emptyOutDir: false,
      commonjsOptions: {include: []},
    },
    optimizeDeps: {disabled: false},
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
