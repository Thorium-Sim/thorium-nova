const {nativeNodeModulesPlugin} = require("./nativeNodeModulesPlugin");
const yazl = require("yazl");
const fs = require("fs");
const path = require("path");

const ignoreFiles = [".git", ".DS_Store"];

async function addDirectory(zip, realPath, metadataPath) {
  // calculate the files recursively
  const files = await fs.promises.readdir(realPath);
  await Promise.all(
    files.map(async function checkFile(file) {
      if (ignoreFiles.some(i => file.includes(i))) {
        return;
      }
      if ((await fs.promises.stat(path.join(realPath, file))).isDirectory()) {
        await addDirectory(
          zip,
          path.join(realPath, file),
          metadataPath + "/" + file
        );
      } else {
        zip.addFile(path.join(realPath, file), metadataPath + "/" + file);
      }
    })
  );
}

async function bundleDefaultPlugin() {
  const zip = new yazl.ZipFile();
  await addDirectory(zip, "data/plugins/Thorium Default", "Thorium Default");
  zip.end();
  await fs.promises.mkdir("../dist", {recursive: true});
  await new Promise((res, rej) => {
    const stream = zip.outputStream.pipe(
      fs.createWriteStream("../dist/defaultPlugin.zip")
    );
    stream.on("error", err => {
      console.error("Zip error", err);
      rej();
    });
    stream.on("finish", () => {
      res();
    });
  });
}
async function buildServer() {
  await Promise.all([
    require("esbuild")
      .build({
        define: {"process.env.NODE_ENV": '"production"'},
        entryPoints: ["src/index.ts"],
        bundle: true,
        platform: "node",
        target: "node16",
        outdir: "../dist",
        plugins: [nativeNodeModulesPlugin],
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      }),
    bundleDefaultPlugin(),
  ]);
  await fs.promises.mkdir("../dist/resources", {recursive: true});
  await fs.promises.copyFile(
    "../desktop/resources/server.cert",
    "../dist/resources/server.cert"
  );
  await fs.promises.copyFile(
    "../desktop/resources/server.key",
    "../dist/resources/server.key"
  );
}

buildServer();
