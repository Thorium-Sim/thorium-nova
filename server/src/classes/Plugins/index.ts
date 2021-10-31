import {pubsub} from "server/src/utils/pubsub";
import type {ServerDataModel} from "../ServerDataModel";
import {generateIncrementedName} from "../../utils/generateIncrementedName";
import ShipPlugin from "./Ship";
import {thoriumPath} from "server/src/utils/appPaths";
import {parse} from "yaml";
import fs from "fs/promises";
import {YAMLSemanticError} from "yaml/util";
import {FSDataStore} from "@thorium/db-fs";
import path from "path";

export function pluginPublish(plugin: BasePlugin) {
  pubsub.publish("pluginsList", {
    id: plugin.id,
  });
  pubsub.publish("plugin", {
    pluginId: plugin.id,
  });
}

interface Aspects {
  ships: ShipPlugin[];
}
// Storing the server here so it doesn't get
// serialized with the plugin.
let storedServer: ServerDataModel;
// Same with plugin aspects. By storing them in a WeakMap,
// they'll be keyed to the plugin, but will automatically
// be garbage collected if the plugin is ever deleted.
let pluginAspects = new WeakMap<BasePlugin, Aspects>();
export default class BasePlugin extends FSDataStore {
  id: string;
  name: string;
  author: string;
  description: string;
  _coverImage: string;
  get coverImage() {
    // Allow images from the internet
    if (this._coverImage.startsWith("http")) return this._coverImage;
    // Allow absolute paths
    if (this._coverImage.startsWith("/")) return this._coverImage;
    // Otherwise, resolve and return the relative path
    return `${this.pluginPath}/assets/${this._coverImage}`;
  }
  set coverImage(coverImage: string) {
    this._coverImage = coverImage;
  }
  get pluginPath() {
    return `/plugins/${this.name}`;
  }

  tags: string[];
  constructor(params: Partial<BasePlugin> = {}, server: ServerDataModel) {
    const name = generateIncrementedName(
      params.name || "New Plugin",
      server.plugins.map(p => p.name)
    );
    super(params, {
      path: `/plugins/${name}/manifest.yml`,
    });
    this.id = params.id || name;
    this.name = name;
    this.author = params.author || "";
    this.description = params.description || "A great plugin";
    this._coverImage = params.coverImage || "";
    this.tags = params.tags || [];
    storedServer = server;

    this.loadAspects();
  }
  get server() {
    return storedServer;
  }
  get aspects(): Aspects {
    let aspects = pluginAspects.get(this);
    if (!aspects) {
      aspects = {
        ships: [],
      };
      pluginAspects.set(this, aspects);
    }
    return aspects;
  }
  async loadAspects() {
    this.aspects.ships = await BasePlugin.loadAspect(this, "ships", ShipPlugin);
  }
  toJSON() {
    const {_coverImage, ...data} = this;
    return {...data, coverImage: this.coverImage};
  }
  serialize() {
    const {_coverImage, ...data} = this;
    return {...data, coverImage: _coverImage};
  }
  async rename(name: string) {
    if (name.trim() === this.name) return;
    const newName = generateIncrementedName(
      name.trim() || this.name,
      this.server.plugins.map(p => p.name)
    );
    await fs.rename(
      `${thoriumPath}/plugins/${this.name}`,
      `${thoriumPath}/plugins/${newName}`
    );
    this.id = newName;
    this.name = newName;
    this.path = `/plugins/${newName}/manifest.yml`;

    // Also rename the cover image
    const coverImage = path.basename(this.coverImage);
    this.coverImage = `${this.pluginPath}/assets/${coverImage}`;
    // TODO October 29, 2021: Rename all of the assets associated with
    // aspects of this plugin too.

    await this.writeFile(true);
  }
  async writeFile(force: boolean = false) {
    await super.writeFile(force);
    if (force) {
      for (let aspect in this.aspects) {
        for (let aspectInstance of this.aspects[aspect as keyof Aspects]) {
          await aspectInstance.writeFile(force);
        }
      }
    }
  }
  duplicate(name: string) {
    const data = {...this};
    data.name = name;
    data.id = generateIncrementedName(
      name,
      this.server.plugins.map(p => p.name)
    );
    // TODO October 23: Properly duplicate all of the files associated with this plugin
    // in the file system
    return new BasePlugin(data, this.server);
  }
  static async loadAspect<T>(
    plugin: BasePlugin,
    aspectName: string,
    aspect: {
      new (
        manifest: {name: string} & Record<string, any>,
        plugin: BasePlugin
      ): T;
    }
  ) {
    const objectGlob = `${thoriumPath}/plugins/${plugin.id}/${aspectName}/*/manifest.yml`;
    const {globby} = await import("globby");
    const aspectPaths = await globby(objectGlob);
    let aspects: T[] = [];
    for (const aspectPath of aspectPaths) {
      try {
        const manifest = parse(await fs.readFile(aspectPath, "utf8"));
        aspects.push(new aspect(manifest, plugin));
      } catch (err) {
        if (err instanceof YAMLSemanticError) {
          console.error(
            `Error parsing ${aspectPath
              .replace(`${thoriumPath}/plugins/`, "")
              .replace("/manifast.yml", "")} on line ${
              err.source?.rangeAsLinePos?.start.line
            }: ${err.message}`
          );
        }
      }
    }
    return aspects;
  }
}
