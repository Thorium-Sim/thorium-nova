import {FSDataStore, FSDataStoreOptions} from "@thorium/db-fs";
import {thoriumPath} from "../utils/appPaths";
import {ServerClient} from "./Client";
import BasePlugin from "./Plugins";

export class ServerDataModel extends FSDataStore {
  clients!: Record<string, ServerClient>;
  thoriumId!: string;
  activeFlightName!: string | null;
  plugins: BasePlugin[] = [];
  constructor(params: Partial<ServerDataModel>, options: FSDataStoreOptions) {
    super(params, options);
    if (this.clients) {
      this.clients = Object.fromEntries(
        Object.entries(this.clients).map(([id, client]) => [
          id,
          new ServerClient(client),
        ])
      );
    } else {
      this.clients = Object.fromEntries(
        Object.entries(params.clients || {}).map(([id, client]) => [
          id,
          new ServerClient(client),
        ])
      );
    }
    this.#loadPlugins();
  }
  #loadPlugins = async () => {
    const {globby} = await import("globby");
    const plugins = await globby(`${thoriumPath}/plugins/*/manifest.yml`);
    const pluginRegex = new RegExp(`${thoriumPath}/plugins/(.*)/manifest.yml`);
    plugins.forEach(plugin => {
      const name = pluginRegex.exec(plugin)![1];
      this.plugins.push(new BasePlugin({name}, this));
    });
  };
  serialize() {
    const {plugins, ...data} = this;
    return {
      ...data,
      // We don't want to serialize and store the Geckos channels, so we remove
      // them from the clients.
      clients: Object.fromEntries(
        Object.entries(this.clients).map(([clientId, client]) => {
          return [clientId, client.serialize()];
        })
      ),
    };
  }
}
