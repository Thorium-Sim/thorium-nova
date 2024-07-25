import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class TargetingSystemPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = [];
	type = "targeting" as const;
	allowMultiple = false;

	// constructor(params: Partial<TargetingSystemPlugin>, plugin: BasePlugin) {
	//   super(params, plugin);
	// }
}
registerSystem("generic", TargetingSystemPlugin);
