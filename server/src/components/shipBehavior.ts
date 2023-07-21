import {Kilometer, Meter} from "../utils/unitTypes";
import {Component} from "./utils";

/**
 * Determines what a ship is trying to do on the star map
 */
export class ShipBehaviorComponent extends Component {
  static id: "shipBehavior" = "shipBehavior";

  /**
   * The main thing the ship is trying to accomplish
   * - hold: stay in place
   * - seek: move towards a target
   * - patrol: move within a radius of a point
   * - attack: move towards a target and attack it
   * - defend: move towards a target and defend it
   * - avoid: move away from a target
   */
  objective: "hold" | "seek" | "patrol" | "attack" | "defend" | "avoid" =
    "hold";

  /**
   * The target of the ship's objective
   * If it's a number, it's an entity of some kind.
   * If it's an object, it's a point in space.
   * If it's null, there is no target.
   */
  target:
    | null
    | number
    | {
        parentId: number | null;

        x: number;
        y: number;
        z: number;
      } = null;

  /**
   * The point the ship is currently trying to get to.
   * This is different from the target, since the target
   * might be a ship, while this point is somewhere close
   * to that ship. Or the destination could be another
   * point in space within a sphere centered around the target.
   */
  destination: null | {
    parentId: number | null;

    x: number;
    y: number;
    z: number;
  } = null;

  /**
   * The radius of the sphere where the ship will attempt to patrol,
   * basically mid-orbit. When patrolling around a planet, set this
   * to 5 times the planet's radius.
   */
  patrolRadius: Kilometer = 25_000;
}
