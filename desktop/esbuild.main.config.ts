import {BuildOptions} from "esbuild";
import path from "path";

export default {
  platform: "node",
  entryPoints: [
    path.resolve("main/electron.ts"),
    path.resolve("main/preload.ts"),
  ],
  bundle: true,
  target: "node16.15.0", // electron version target
} as BuildOptions;
