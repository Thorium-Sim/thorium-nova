import {MegaWatt, MegaWattHour} from "@server/utils/unitTypes";
import BasePlugin from "..";
import BaseShipSystemPlugin, {registerSystem} from "./BaseSystem";
import {ShipSystemFlags} from "./shipSystemTypes";

export default class BatteryPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency"];
  type: "battery" = "battery";
  allowMultiple = true;

  /**
   * The amount of power this battery can hold. This provides
   * 23 minutes of sustained power.
   */
  capacity: MegaWattHour;
  /**
   * How much energy the battery can use to charge. Typically
   * batteries charge faster than they discharge, while capacitors
   * discharge much faster than they charge.
   */
  chargeRate: MegaWatt;

  /**
   * How much energy the battery provides to connected systems.
   */
  dischargeRate: MegaWatt;
  constructor(params: Partial<BatteryPlugin>, plugin: BasePlugin) {
    super(params, plugin);

    this.capacity = params.capacity || 46;
    this.chargeRate = params.chargeRate || 180;
    this.dischargeRate = params.dischargeRate || 120;
  }
}
registerSystem("battery", BatteryPlugin);
