import path from "path";
import fs from "fs";
import os from "os";

if (!fs.existsSync(`${os.homedir()}/Documents`)) {
  fs.mkdirSync(`${os.homedir()}/Documents`);
}

export let thoriumPath = `${os.homedir()}/Documents/thorium`;

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

if (process.env.NODE_ENV === "production") {
  assetDir = `${thoriumPath}/assets`;
}

export let appStoreDir = "./data/";

if (process.env.NODE_ENV === "production") {
  appStoreDir = thoriumPath + "/";
}

const appStoreName =
  process.env.NODE_ENV === "production"
    ? "snapshot.json"
    : process.env.NODE_ENV === "test"
    ? "snapshot-test.json"
    : "snapshot-dev.json";

export const appStorePath = `${appStoreDir}${appStoreName}`;
