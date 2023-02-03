import BaseShipSystemPlugin, {registerSystem} from "./BaseSystem";
import {ShipSystemFlags} from "./shipSystemTypes";

export default class GenericSystemPlugin extends BaseShipSystemPlugin {
  static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
  type: "generic" = "generic";
  allowMultiple = true;
  // constructor(params: Partial<GenericSystemPlugin>, plugin: BasePlugin) {
  //   super(params, plugin);
  // }
}
registerSystem("generic", GenericSystemPlugin);
