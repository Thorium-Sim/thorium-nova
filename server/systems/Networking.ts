import System from "../helpers/ecs/system";
import {pubsub} from "../helpers/pubsub";

export class Networking extends System {
  static updatesPerSecond = 30;
  lastUpdate = Date.now();
  preUpdate(elapsed: number) {
    if (Date.now() - this.lastUpdate > 1000 / Networking.updatesPerSecond) {
      const playerShips = this.ecs.entities.filter(
        e => e.isShip && e.isPlayerShip
      );
      playerShips.forEach(e => {
        pubsub.publish("playerShipHot", {
          shipId: e.id,
          ship: e,
        });
      });

      const systemIds = playerShips
        .map(e => e.interstellarPosition?.systemId)
        .filter((a, i, arr) => a && arr.indexOf(a) === i);
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
