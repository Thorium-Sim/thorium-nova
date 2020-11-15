import Entity from "../helpers/ecs/entity";
import System from "../helpers/ecs/system";
import {Duration} from "luxon";
import {pubsub} from "../helpers/pubsub";

export class Networking extends System {
  static updatesPerSecond = 30;
  lastUpdate = Date.now();
  preUpdate(elapsed: number) {
    if (Date.now() - this.lastUpdate > 1000 / Networking.updatesPerSecond) {
      // TODO: Publish for all of the systems inhabited by player ships
      const systemIds = ["ew1d9kfkfhc49g2"];
      systemIds.forEach(id => {
        pubsub.publish("universeSystemShipsHot", {
          systemId: id,
          ships: this.ecs.entities.filter(
            s => s.interstellarPosition?.systemId === id
          ),
        });
      });
      this.lastUpdate = Date.now();
    }
  }
}
