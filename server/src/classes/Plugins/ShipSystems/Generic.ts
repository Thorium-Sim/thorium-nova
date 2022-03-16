import BasePlugin from "..";
import BaseShipSystemPlugin from "./BaseSystem";
import {ShipSystemFlags} from "./shipSystemTypes";

export default class GenericSystemPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
  type: "generic" = "generic";
  constructor(params: Partial<GenericSystemPlugin>, plugin: BasePlugin) {
    super(params, plugin);
  }
}
