import type {KilometerPerSecond, KiloNewtons} from "server/src/utils/unitTypes";
import type BasePlugin from "..";
import BaseShipSystemPlugin, {registerSystem} from "./BaseSystem";
import type {PowerNodes, ShipSystemFlags} from "./shipSystemTypes";

// TODO March 16, 2022: Add the necessary sound effects
export default class ImpulseEnginesPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
  type = "impulseEngines" as const;
  cruisingSpeed: KilometerPerSecond;
  emergencySpeed: KilometerPerSecond;
  thrust: KiloNewtons;
  powerNode?: PowerNodes = "navigation";
  constructor(params: Partial<ImpulseEnginesPlugin>, plugin: BasePlugin) {
    super(params, plugin);
    this.cruisingSpeed = params.cruisingSpeed || 1500;
    this.emergencySpeed = params.emergencySpeed || 2000;
    this.thrust = params.thrust || 12500;
  }
}
registerSystem("impulseEngines", ImpulseEnginesPlugin);
