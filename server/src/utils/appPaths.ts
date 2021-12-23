import fs from "fs";
import os from "os";
import path from "path";

const isHeadless = !process.env.FORK;
export const rootPath = isHeadless
  ? process.env.NODE_PATH || __dirname
  : __dirname;

export let thoriumPath = path.join(process.cwd(), "data");
/* istanbul ignore next */
if (process.env.NODE_ENV === "production") {
  /* istanbul ignore next */
  if (!fs.existsSync(`${os.homedir()}/Documents`)) {
    /* istanbul ignore next */
    fs.mkdirSync(`${os.homedir()}/Documents`, {recursive: true});
  }
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

/* format path to function with windows machines */
thoriumPath = thoriumPath.replaceAll("\\", "/");

export const databaseName =
  process.env.NODE_ENV === "production"
    ? /* istanbul ignore next */
      "db.yml"
    : process.env.NODE_ENV === "test"
    ? "db-test.yml"
    : /* istanbul ignore next */
      "db-dev.yml";
