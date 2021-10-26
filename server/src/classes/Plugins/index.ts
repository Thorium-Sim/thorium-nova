import uniqid from "@thorium/uniqid";
import {pubsub} from "server/src/utils/pubsub";

export function pluginPublish(plugin: BasePlugin) {
  pubsub.publish("pluginsList", {
    id: plugin.id,
  });
  pubsub.publish("plugin", {
    pluginId: plugin.id,
  });
}

export default class BasePlugin {
  id: string;
  name: string;
  author: string;
  description: string;
  coverImage: string;
  assetPath(asset: string) {
    return asset ? `/plugins/${this.name}/assets/${asset}` : "";
  }

  tags: string[];

  constructor(params: Partial<BasePlugin> = {}) {
    this.id = params.id || uniqid();
    this.name = params.name || "New Plugin";
    this.author = params.author || "";
    this.description = params.description || "A great plugin";
    this.coverImage = params.coverImage || "";
    this.tags = params.tags || [];
  }
  async writeFile(force?: boolean) {}
  async removeFile(force?: boolean) {}

  save() {
    this.writeFile(true);
  }
  serialize() {
    const data = {...this};
    return data;
  }
  duplicate(name: string) {
    const data = this.serialize();
    data.name = name;
    data.id = uniqid();
    // TODO October 23: Properly duplicate all of the files associated with this plugin
    // in the file system
    return new BasePlugin(data);
  }
}
