import { z } from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class LongRangeCommPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("longRangeComm"),
		cyphers: z
			.object({ code: z.string(), name: z.string(), font: z.string(), active: z.boolean() })
			.array(),
	});
	static flags: ShipSystemFlags[] = ["damage", "power", "sounds"];
	type = "longRangeComm" as const;

	cyphers: { code: string; name: string; font: string; active: boolean }[];
	constructor(params: Partial<LongRangeCommPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.cyphers = params.cyphers || [];
	}
}
registerSystem("longRangeComm", LongRangeCommPlugin);
