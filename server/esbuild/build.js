const {nativeNodeModulesPlugin} = require("./nativeNodeModulesPlugin");
const yazl = require("yazl");
const fs = require("fs");
const path = require("path");

var noop = Function.prototype;

function addDirectory(zip, realPath, metadataPath, cb) {
  fs.readdir(realPath, function (error, files) {
    if (error == null) {
      var i = files.length;
      var resolve = function (error) {
        if (error != null) {
          resolve = noop;
          cb(error);
        } else if (--i === 0) {
          resolve = noop;
          cb();
        }
      };
      files.forEach(function (file) {
        if (file.includes(".git")) {
          resolve();
          return;
        }
        addDirectory(
          zip,
          path.join(realPath, file),
          metadataPath + "/" + file,
          resolve
        );
      });
    } else if (error.code === "ENOTDIR") {
      zip.addFile(realPath, metadataPath);
      cb();
    } else {
      cb(error);
    }
  });
}

async function bundleDefaultPlugin() {
  const zip = new yazl.ZipFile();
  await new Promise(resolve =>
    addDirectory(
      zip,
      "data/plugins/Thorium Default",
      "Thorium Default",
      err => {
        if (err) {
          console.err(err);
          process.exit(1);
        }
        resolve();
      }
    )
  );
  zip.end();
  zip.outputStream.pipe(fs.createWriteStream("../dist/defaultPlugin.zip"));
}
async function buildServer() {
  await require("esbuild")
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
    });
  await bundleDefaultPlugin();
  fs.mkdirSync("../dist/resources", {recursive: true});
  fs.copyFileSync(
    "../desktop/resources/server.cert",
    "../dist/resources/server.cert"
  );
  fs.copyFileSync(
    "../desktop/resources/server.key",
    "../dist/resources/server.key"
  );
}

buildServer();
