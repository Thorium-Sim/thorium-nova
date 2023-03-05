import {MegaWatt, MegaWattHour} from "@server/utils/unitTypes";
import {Component} from "../../utils";

export class IsBatteryComponent extends Component {
  static id = "isBattery" as const;

  /**
   * The power nodes that are associated with this battery
   */
  connectedNodes: number[] = [];

  /**
   * The amount of power this battery can hold. This provides
   * 23 minutes of sustained power.
   */
  capacity: MegaWattHour = 46;

  /**
   * How much power the battery is currently storing
   */
  storage: MegaWattHour = 46;
  /**
   * How much energy the battery can use to charge. Typically
   * batteries charge faster than they discharge, while capacitors
   * discharge much faster than they charge.
   */
  chargeRate: MegaWatt = 180;

  /**
   * How much energy the battery provides to connected systems.
   */
  dischargeRate: MegaWatt = 120;

  /**
   * Capacitors only discharge when toggled on. This is where that
   * toggling happens. Normal batteries won't ever adjust this.
   */
  discharging: boolean = true;
}
