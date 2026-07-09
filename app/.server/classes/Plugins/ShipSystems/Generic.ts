import { z } from "zod";

import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class GenericSystemPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("generic"),
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power"];
	type = "generic" as const;
	allowMultiple = true;
	// constructor(params: Partial<GenericSystemPlugin>, plugin: BasePlugin) {
	//   super(params, plugin);
	// }
}
registerSystem("generic", GenericSystemPlugin);
