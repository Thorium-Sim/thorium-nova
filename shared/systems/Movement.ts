import {System} from "ecsy";
import Velocity from "../components/Velocity";
import Acceleration from "../components/Acceleration";
import Position from "../components/Position";
import Prando from "prando";
const rng = new Prando("test");
export default class Movement extends System {
  static queries = {
    movable: {components: [Acceleration, Velocity, Position]},
  };
  execute(delta: number, time: number) {
    const deltaAdjust = delta / 1000;

    this.queries.movable.results.forEach(entity => {
      let acc = entity.getMutableComponent(Acceleration);
      acc.x = rng.next() - 0.5;
      acc.y = rng.next() - 0.5;
      acc.z = rng.next() - 0.5;

      let vel = entity.getMutableComponent(Velocity);
      vel.x = Math.max(-0.1, Math.min(0.1, vel.x + acc.x * deltaAdjust));
      vel.y = Math.max(-0.1, Math.min(0.1, vel.y + acc.y * deltaAdjust));
      vel.z = Math.max(-0.1, Math.min(0.1, vel.z + acc.z * deltaAdjust));

      let pos = entity.getMutableComponent(Position);
      pos.x = Math.max(-0.5, Math.min(0.5, pos.x + vel.x * deltaAdjust));
      pos.y = Math.max(-0.5, Math.min(0.5, pos.y + vel.y * deltaAdjust));
      pos.z = Math.max(-0.5, Math.min(0.5, pos.z + vel.z * deltaAdjust));
    });
  }
}
