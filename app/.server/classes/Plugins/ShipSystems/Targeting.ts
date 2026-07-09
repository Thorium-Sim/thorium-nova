import z from "zod";

import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class TargetingSystemPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("targeting"),
	});
	static flags: ShipSystemFlags[] = [];
	type = "targeting" as const;
	allowMultiple = false;

	// constructor(params: Partial<TargetingSystemPlugin>, plugin: BasePlugin) {
	//   super(params, plugin);
	// }
}
registerSystem("targeting", TargetingSystemPlugin);
