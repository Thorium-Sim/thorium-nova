import z from "zod";

import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

/** This is a legacy system */
export default class CoolantTankSystemPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("coolantTank"),
	});
	static flightModes = ["legacy"];
	static flags: ShipSystemFlags[] = ["heat", "damage"];
	type = "coolantTank" as const;
	allowMultiple = false;

	// constructor(params: Partial<TargetingSystemPlugin>, plugin: BasePlugin) {
	//   super(params, plugin);
	// }
}
registerSystem("coolantTank", CoolantTankSystemPlugin);
