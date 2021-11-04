import BasePlugin from "./index";
import {FSDataStore} from "@thorium/db-fs";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import path from "path";
type AspectKinds = keyof BasePlugin["aspects"];

export abstract class Aspect extends FSDataStore {
  abstract apiVersion: string;
  abstract kind: AspectKinds;
  abstract name: string;
  abstract assets?: Record<string, string>;
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
  /**
   * Used for messages sent to the client. We transform the asset
   * path to make sure it works with the client.
   */
  toJSON() {
    const assets = this.assets || {};
    const transformedAssets = Object.fromEntries(
      Object.entries(assets).map(([key, value]) => {
        // Allow images from the internet
        // Allow absolute paths
        if (!value || value.startsWith("http") || value.startsWith("/"))
          return [key, value];
        return [key, path.join(this.assetPath, value)];
      })
    );
    return {
      ...this,
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
}
