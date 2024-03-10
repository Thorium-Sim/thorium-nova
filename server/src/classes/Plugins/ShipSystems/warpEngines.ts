import {type KilometerPerSecond, KiloNewtons} from "server/src/utils/unitTypes";
import type BasePlugin from "..";
import BaseShipSystemPlugin, {registerSystem} from "./BaseSystem";
import type {PowerNodes, ShipSystemFlags} from "./shipSystemTypes";

// TODO May 3, 2022: Add the necessary sound effects
export default class WarpEnginesPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
  type = "warpEngines" as const;
  /** The cruising speed in interstellar space in km/s */
  interstellarCruisingSpeed: KilometerPerSecond;
  /** The cruising speed in solar system space in km/s */
  solarCruisingSpeed: KilometerPerSecond;
  /** The min speed (warp 1) compared to the cruising speed. Defaults to 0.01 */
  minSpeedMultiplier: number;
  /** How many warp factors there are between min and max inclusive. This does not include emergency or destructive warp which are automatically extrapolated. */
  warpFactorCount: number;
  powerNode?: PowerNodes = "navigation";
  constructor(params: Partial<WarpEnginesPlugin>, plugin: BasePlugin) {
    super(params, plugin);
    this.interstellarCruisingSpeed =
      params.interstellarCruisingSpeed || 599_600_000_000;
    this.solarCruisingSpeed = params.solarCruisingSpeed || 29_980_000;
    this.minSpeedMultiplier = params.minSpeedMultiplier || 0.01;
    this.warpFactorCount = params.warpFactorCount || 5;
  }
}
registerSystem("warpEngines", WarpEnginesPlugin);
