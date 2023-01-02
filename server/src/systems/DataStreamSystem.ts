import {getDataContext} from "@server/init/liveQuery";
import {DataContext} from "@server/utils/DataContext";
import {SERVER_FPS} from "../utils/constants";
import {System} from "../utils/ecs";

export class DataStreamSystem extends System {
  lastUpdate = Date.now();
  postUpdate() {
    if (Date.now() - this.lastUpdate > 1000 / SERVER_FPS) {
      for (let clientId in this.ecs.server.clients) {
        const client = this.ecs.server.clients[clientId];
        const dataContext = getDataContext(client.id);
        if (!client || !dataContext) continue;
        client.sendDataStream(dataContext);
      }
      this.lastUpdate = Date.now();
    }
  }
}
