import {KilometerPerSecond, KiloNewtons} from "server/src/utils/unitTypes";
import BasePlugin from "..";
import BaseShipSystemPlugin from "./BaseSystem";
import {ShipSystemFlags} from "./shipSystemTypes";

// TODO March 16, 2022: Add the necessary sound effects
export default class ImpulseEnginesPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
  type: "impulseEngines" = "impulseEngines";
  cruisingSpeed: KilometerPerSecond;
  emergencySpeed: KilometerPerSecond;
  thrust: KiloNewtons;
  constructor(params: Partial<ImpulseEnginesPlugin>, plugin: BasePlugin) {
    super(params, plugin);
    this.cruisingSpeed = params.cruisingSpeed || 1500;
    this.emergencySpeed = params.emergencySpeed || 2000;
    this.thrust = params.thrust || 12500;
  }
}
