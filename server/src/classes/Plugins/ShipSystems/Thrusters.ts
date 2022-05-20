import {
  KiloNewtons,
  MetersPerSecond,
  RotationsPerMinute,
} from "server/src/utils/unitTypes";
import BasePlugin from "..";
import BaseShipSystemPlugin from "./BaseSystem";
import {ShipSystemFlags} from "./shipSystemTypes";

// TODO March 16, 2022: Add the necessary sound effects
export default class ThrustersPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
  type: "thrusters" = "thrusters";
  directionMaxSpeed: MetersPerSecond;
  directionThrust: KiloNewtons;
  rotationMaxSpeed: RotationsPerMinute;
  rotationThrust: KiloNewtons;
  constructor(params: Partial<ThrustersPlugin>, plugin: BasePlugin) {
    super(params, plugin);
    this.directionMaxSpeed = params.directionMaxSpeed || 1;
    this.directionThrust = params.directionThrust || 12500;
    this.rotationMaxSpeed = params.rotationMaxSpeed || 5;
    this.rotationThrust = params.rotationThrust || 12500;
  }
}
