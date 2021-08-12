import {Entity, System} from "../utils/ecs";

export class DataStreamSystem extends System {
  static updatesPerSecond = 3;
  lastUpdate = Date.now();

  postUpdate() {
    if (
      Date.now() - this.lastUpdate >
      1000 / DataStreamSystem.updatesPerSecond
    ) {
      for (let clientId in this.ecs.server.clients) {
        const client = this.ecs.server.clients[clientId];
        client.sendDataStream();
      }
      this.lastUpdate = Date.now();
    }
  }
}
