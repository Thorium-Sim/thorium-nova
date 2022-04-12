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
  async duplicate(name: string) {
    const data = {...this};
    data.name = generateIncrementedName(
      name,
      this.plugin.aspects[this.kind].map(aspect => aspect.name)
    );
    // TODO November 26, 2021: Properly duplicate all of the files associated with this aspect
    // in the file system
    const duplicateConstructor = this.constructor as any;
    return new duplicateConstructor(data);
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
    if (process.env.NODE_ENV !== "test") {
      await fs.rename(
        `${thoriumPath}/${aspectPath}`,
        `${thoriumPath}/${newAspectPath}`
      );
    }
    this.path = path.join(newAspectPath, "manifest.yml");
    this.name = newName;

    // Assets should automatically be renamed by virtue of
    // being relative links.
    await this.writeFile(true);
  }
}
