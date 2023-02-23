import {promises as fs} from "fs";
import path from "path";
import {rootPath, thoriumPath} from "@server/utils/appPaths";
import {unzip} from "@server/utils/unzipFolder";

const isHeadless = !process.env.FORK;

export async function initDefaultPlugin() {
  await fs.mkdir(thoriumPath, {recursive: true});
  await fs.mkdir(path.join(thoriumPath, "plugins"), {recursive: true});

  // Initialize the default plugin
  await unzip(
    path.join(rootPath, isHeadless ? "./" : "../../app", "defaultPlugin.zip"),
    path.join(thoriumPath, "plugins/")
  );
}
