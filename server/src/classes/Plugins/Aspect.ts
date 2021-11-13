import BasePlugin from "./index";
import {FSDataStore} from "@thorium/db-fs";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import path from "path";
import {promises as fs} from "fs";
import {thoriumPath} from "server/src/utils/appPaths";

type AspectKinds = keyof BasePlugin["aspects"];

type AspectAsset = {
  [assetName: string]: string | string[];
};
function transformStringAsset(value: string, assetPath: string) {
  // Allow images from the internet
  // Allow absolute paths
  if (!value || value.startsWith("http") || value.startsWith("/")) return value;
  return path.join(assetPath, value);
}
export abstract class Aspect extends FSDataStore {
  abstract apiVersion: string;
  abstract kind: AspectKinds;
  abstract name: string;
  abstract assets?: AspectAsset;
  plugin: BasePlugin;
  constructor(
    params: {name: string},
    aspectConfig: {kind: AspectKinds; subPath?: `/${string}`},
    plugin: BasePlugin
  ) {
    const {kind, subPath = "/"} = aspectConfig;
    const name = generateIncrementedName(
      params.name || `New ${kind}`,
      plugin.aspects[kind].map(aspect => aspect.name)
    );
    super(params, {
      path: `/plugins/${plugin.id}/${kind}${subPath}${name}/manifest.yml`,
    });
    this.plugin = plugin;
  }
  get assetPath() {
    return path.join(path.dirname(this.path), "assets");
  }
  get pluginName() {
    return this.plugin.name;
  }
  /**
   * Used for messages sent to the client. We transform the asset
   * path to make sure it works with the client.
   */
  toJSON() {
    const assets = this.assets || {};
    const transformedAssets = Object.fromEntries(
      Object.entries(assets).map(([key, value]) => {
        if (typeof value === "string") {
          return [key, transformStringAsset(value, this.assetPath)];
        } else {
          return [key, value.map(v => transformStringAsset(v, this.assetPath))];
        }
      })
    );
    const {plugin, ...data} = this;
    return {
      ...data,
      pluginName: this.pluginName,
      assets: transformedAssets,
    };
  }
  /**
   * Used for serializing the data before it is stored in the file system.
   */
  serialize() {
    const {plugin, ...data} = this;

    return data;
  }
  async removeFile() {
    await super.removeFile();
    await fs.rm(path.join(thoriumPath, path.dirname(this.path)), {
      recursive: true,
      force: true,
    });
  }
  async rename(name: string) {
    if (name.trim() === this.name) return;
    const newName = generateIncrementedName(
      name.trim() || this.name,
      this.plugin.aspects[this.kind].map(item => item.name)
    );
    const aspectPath = path.dirname(this.path);
    const newAspectPath = path.join(aspectPath, "..", newName);

    await fs.rename(
      `${thoriumPath}/${aspectPath}`,
      `${thoriumPath}/${newAspectPath}`
    );
    this.path = path.join(newAspectPath, "manifest.yml");
    this.name = newName;

    // Assets should automatically be renamed by virtue of
    // being relative links.
    await this.writeFile(true);
  }
}
