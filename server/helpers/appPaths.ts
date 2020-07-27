import path from "path";
import fs from "fs";
import os from "os";

/* istanbul ignore next */
if (!fs.existsSync(`${os.homedir()}/Documents`)) {
  /* istanbul ignore next */
  fs.mkdirSync(`${os.homedir()}/Documents`);
}

export let thoriumPath = `${os.homedir()}/Documents/thorium`;
/* istanbul ignore next */
if (process.env.THORIUM_PATH) {
  const testPath = String(process.env.THORIUM_PATH).replace("~", os.homedir());
  try {
    fs.mkdirSync(testPath, {recursive: true});
    thoriumPath = testPath;
  } catch {
    // Do nothing.
  }
}

export let assetDir = path.resolve("./assets");

/* istanbul ignore next */
if (process.env.NODE_ENV === "production") {
  assetDir = `${thoriumPath}/assets`;
}

export let appStoreDir = "./data/";

/* istanbul ignore next */
if (process.env.NODE_ENV === "production") {
  appStoreDir = thoriumPath + "/";
}

fs.mkdirSync(appStoreDir, {recursive: true});
fs.mkdirSync(assetDir, {recursive: true});

const appStoreName =
  process.env.NODE_ENV === "production"
    ? /* istanbul ignore next */
      "snapshot.json"
    : process.env.NODE_ENV === "test"
    ? "snapshot-test.json"
    : /* istanbul ignore next */
      "snapshot-dev.json";

export const appStorePath = `${appStoreDir}${appStoreName}`;
