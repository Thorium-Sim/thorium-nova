import {FSDataStore, type FSDataStoreOptions} from "@thorium/db-fs";
import {thoriumPath} from "../utils/appPaths";
import {Client} from "../init/liveQuery";
import BasePlugin from "./Plugins";
import fg from "fast-glob";
import {router} from "@server/init/router";
import {pubsub} from "@server/init/pubsub";
import randomWords from "@thorium/random-words";

export class ServerDataModel extends FSDataStore {
  clients!: Record<string, Client<any>>;
  thoriumId!: string;
  activeFlightName!: string | null;
  plugins: BasePlugin[] = [];
  constructor(params: Partial<ServerDataModel>, options: FSDataStoreOptions) {
    super(params, options);
    const data = this.getData();
    this.activeFlightName = data.activeFlightName || null;
    this.thoriumId = data.thoriumId || randomWords(3).join("-");
    if (this.clients) {
      this.clients = Object.fromEntries(
        Object.entries(this.clients).map(([id, client]) => {
          const c = new Client(client.id, router, pubsub);
          c.name = client.name;
          return [id, c];
        })
      );
    } else {
      this.clients = Object.fromEntries(
        Object.entries(data.clients || {}).map(([id, client]: any) => {
          const c = new Client(client.id, router, pubsub);
          c.name = client.name;
          return [id, c];
        })
      );
    }
    this.#loadPlugins();
  }
  #loadPlugins = async () => {
    const plugins = await fg(`${thoriumPath}/plugins/*/manifest.yml`);
    const pluginRegex = new RegExp(`${thoriumPath}/plugins/(.*)/manifest.yml`);
    if (plugins.length === 0)
      throw new Error("Thorium Nova requires at least one plugin to run.");
    plugins.forEach(plugin => {
      const name = pluginRegex.exec(plugin)![1];
      this.plugins.push(new BasePlugin({name}, this));
    });
  };
  toJSON() {
    const {plugins, clients, ...data} = this;
    return {
      ...data,
      clients: Object.fromEntries(
        Object.entries(clients).map(([id, client]) => [id, client.toJSON()])
      ),
    };
  }
}
