import {spawnShipSystem} from "@server/spawners/shipSystem";
import {Entity} from "@server/utils/ecs";
import BasePlugin from "..";
import BaseShipSystemPlugin from "./BaseSystem";
import {ShipSystemFlags} from "./shipSystemTypes";

export default class ReactorPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency", "heat"];
  type: "reactor" = "reactor";

  /**
   * What percent of the max output provides a 100% fuel-to-energy conversion.
   * Any higher output than this decreases overall efficiency,
   * any lower increases overall efficiency, making fuel last longer.
   */
  optimalOutputPercent: number;
  /**
   * Determines the total output of all reactors by multiplying this by all
   * ship system's default power.
   */
  powerMultiplier: number;
  /**
   * The max power output of each reactor is determined by the power
   * required by all of the systems on the ship divided by the
   * number of reactors. Maybe with a bit of margin for error, just
   * in case.
   */
  reactorCount: number;
  constructor(params: Partial<ReactorPlugin>, plugin: BasePlugin) {
    super(params, plugin);

    this.optimalOutputPercent = params.optimalOutputPercent || 0.5;
    this.reactorCount = params.reactorCount || 4;
    this.powerMultiplier = params.powerMultiplier || 1;
  }
  makeEntities(overrides?: Record<string, any>): Entity[] {
    return Array.from({length: this.reactorCount}).map(() =>
      spawnShipSystem(this, overrides)
    );
  }
}
