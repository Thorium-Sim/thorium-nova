import {ServerClient} from "./Client";

export class ServerDataModel {
  clients: Record<string, ServerClient>;
  thoriumId: string;
  activeFlightName: string | null;
  constructor(params: ServerDataModel) {
    this.clients = Object.fromEntries(
      Object.entries(params.clients).map(([id, client]) => [
        id,
        new ServerClient(client),
      ])
    );
    this.thoriumId = params.thoriumId;
    this.activeFlightName = params.activeFlightName;
  }
}
