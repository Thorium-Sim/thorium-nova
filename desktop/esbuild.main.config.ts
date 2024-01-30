import path from "path";
import {BuildOptions} from "esbuild";

export default {
  platform: "node",
  entryPoints: [path.resolve("main/electron.ts")],
  bundle: true,
  format: "esm",
  target: "node18.18.2", // electron version target
  banner: {
    js: "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
  },
} as BuildOptions;
