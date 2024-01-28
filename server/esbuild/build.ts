import {promises as fs} from "fs";
import path from "path";
import esbuild from "esbuild";
import {thoriumPath} from "../src/utils/appPaths";
import {zip} from "../src/utils/zip";
import {nativeNodeModulesPlugin} from "./nativeNodeModulesPlugin";

const ignoreFiles = [".git", ".DS_Store"];

await fs.mkdir("../dist/resources", {recursive: true});

await Promise.all([
  esbuild
    .build({
      define: {"process.env.NODE_ENV": '"production"'},
      entryPoints: ["src/index.ts"],
      bundle: true,
      platform: "node",
      target: "node20",
      format: "esm",
      outdir: "../dist",
      plugins: [nativeNodeModulesPlugin],
      external: ["jsdom"],
      legalComments: "inline",
      banner: {
        js: "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
      },
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    }),
  await zip(
    path.join(thoriumPath, "plugins/Thorium Default"),
    path.join("../dist/defaultPlugin.plug"),
    {ignoreFiles}
  ),
  fs.copyFile(
    "../desktop/resources/server.cert",
    "../dist/resources/server.cert"
  ),
  fs.copyFile(
    "../desktop/resources/server.key",
    "../dist/resources/server.key"
  ),
]);
