import fs from "fs";
import os from "os";
import path from "path";

/* istanbul ignore next */
if (!fs.existsSync(`${os.homedir()}/Documents`)) {
  /* istanbul ignore next */
  fs.mkdirSync(`${os.homedir()}/Documents`, {recursive: true});
}

export let thoriumPath = path.join(process.cwd(), "data");
/* istanbul ignore next */
if (process.env.NODE_ENV === "production") {
  thoriumPath = path.join(os.homedir(), `/Documents/thorium-nova`);
}
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

fs.mkdirSync(thoriumPath, {recursive: true});

export const databaseName =
  process.env.NODE_ENV === "production"
    ? /* istanbul ignore next */
      "db.json"
    : process.env.NODE_ENV === "test"
    ? "db-test.json"
    : /* istanbul ignore next */
      "db-dev.json";
