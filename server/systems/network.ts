import {System} from "ecsy";
import Networkable from "../components/Networkable";
import {pubsub} from "../helpers/pubsub";

export default class Network extends System {
  static queries = {
    entities: {
      components: [Networkable],
    },
  };
  flightId: string = "uninitialized";
  init({flightId}: {flightId: string}) {
    this.flightId = flightId;
  }
  execute(delta: number, time: number) {
    const gameState = this.queries.entities.results.map(e => {
      return {
        // @ts-ignore
        id: e.name,
        ...e.getComponents(),
      };
    });
    pubsub.publish("objects", {flightId: this.flightId, objects: gameState});
  }
}
