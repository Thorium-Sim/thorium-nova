const {nativeNodeModulesPlugin} = require("./nativeNodeModulesPlugin");
require("esbuild")
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node14",
    outdir: "../dist",
    plugins: [nativeNodeModulesPlugin],
  })
  .catch(() => process.exit(1));
