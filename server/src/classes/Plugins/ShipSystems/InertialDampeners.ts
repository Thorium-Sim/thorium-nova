import type BasePlugin from "..";
import BaseShipSystemPlugin, {registerSystem} from "./BaseSystem";
import type {ShipSystemFlags} from "./shipSystemTypes";

export default class InertialDampenersPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = [];
  type = "inertialDampeners" as const;
  /**
   * A number > 0. Pulls the ship's velocity to make it match the current heading
   *  and affects how fast the ship slows down when engines are turned off.
   * Lower number means slow the ship down faster */
  dampening: number;
  constructor(params: Partial<InertialDampenersPlugin>, plugin: BasePlugin) {
    super(params, plugin);
    this.dampening = params.dampening || 1;
  }
}
registerSystem("inertialDampeners", InertialDampenersPlugin);

/**
 * Dampening works like such.
 *
 * An acceleration is applied to the ship equal to the current velocity
 * multiplied by the reciprocal of the dampening factor plus 1. So 1 / (d + 1).
 * This makes it so the dampening factor is just a positive number and we don't
 * have to deal with reciprocals of decimals less than 1.
 * If our dampening factor is 10 we're going 300 km/s and stop, in the first
 * frame, we will slow down by 27 km/s. , then 24 km/s, etc. It's a logarithmic
 * plateau which will eventually be cut off to 0 km/s.
 *
 * This will be based on the current velocity of the ship that is _not_ in the
 * current direction of acceleration. So if our acceleration is {x:1, y:0, z:0}
 * and our velocity is {x: 21, y:5, z:2}, our dampening acceleration will be
 * {x: 0, y: 0.45, z:0.18}.
 */
