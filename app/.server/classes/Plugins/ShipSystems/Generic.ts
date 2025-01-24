import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class GenericSystemPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
	type = "generic" as const;
	allowMultiple = true;
	// constructor(params: Partial<GenericSystemPlugin>, plugin: BasePlugin) {
	//   super(params, plugin);
	// }
}
registerSystem("generic", GenericSystemPlugin);
