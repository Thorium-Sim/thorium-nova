import {ServerClient} from "./Client";
import BasePlugin from "./Plugins";

export class ServerDataModel {
  clients: Record<string, ServerClient>;
  thoriumId: string;
  activeFlightName: string | null;
  plugins: BasePlugin[] = [];
  constructor(params: ServerDataModel) {
    this.clients = Object.fromEntries(
      Object.entries(params.clients).map(([id, client]) => [
        id,
        new ServerClient(client),
      ])
    );
    this.thoriumId = params.thoriumId;
    this.activeFlightName = params.activeFlightName;
    this.plugins = params.plugins?.map(plugin => new BasePlugin(plugin)) || [];
  }
}
