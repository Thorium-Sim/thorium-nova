import {defineConfig} from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import tsconfigPaths from "vite-tsconfig-paths";
import reactJsx from "vite-react-jsx";

function releasesPlugin() {
  return {
    name: "releases",
    async transform(src, id: string) {
      const fs = await import("fs/promises");
      const path = await import("path");
      const {default: markdown} = await import("markdown-it");
      const releaseNotes = await fs.readFile(
        path.resolve("../ARCHITECTURE.md"),
        "utf8"
      );
      const html = markdown().render(releaseNotes);
      if (id.endsWith("release-notes.json")) {
        return {
          code: `export default {data:\`${html}\`}`,
          map: null,
        };
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), tsconfigPaths(), reactJsx(), releasesPlugin()],
  build: {
    outDir: "../dist/public",
    emptyOutDir: false,
  },
  base: "",
  server: {
    open: true,
    proxy: {
      // "/components": "http://localhost:3001/components",
    },
    fs: {
      strict: false,

      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },
});
