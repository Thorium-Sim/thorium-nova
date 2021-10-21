import uniqid from "@thorium/uniqid";
import {pubsub} from "server/src/utils/pubsub";

// export function publish(plugin: BasePlugin) {
//   pubsub.publish("plugins", {
//     id: plugin.id,
//   });
//   pubsub.publish("plugin", {
//     id: plugin.id,
//   });
// }

export default class BasePlugin {
  id: string;
  name: string;
  author: string;
  description: string;
  assetPath(asset: string) {
    return asset ? `/plugins/${this.name}/${asset}` : "";
  }
  get coverImage() {
    return this.assetPath(this._coverImage);
  }
  set coverImage(value) {
    this._coverImage = value;
  }
  _coverImage!: string;

  tags: string[];

  constructor(params: Partial<BasePlugin> = {}) {
    this.id = params.id || uniqid();
    this.name = params.name || "New Plugin";
    this.author = params.author || "";
    this.description = params.description || "A great plugin";
    this.coverImage = params._coverImage || "";
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
}
