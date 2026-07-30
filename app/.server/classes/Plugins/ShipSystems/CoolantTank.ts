import type BasePlugin from "@thorium/.server/classes/Plugins";
import z from "zod";

import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class CoolantTankPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("coolantTank"),
		tankCapacity: z.number(),
		coolantDensity: z.number(),
		coolantSpecificHeat: z.number(),
		pumpBaseFlowRate: z.number(),
		radiatorArea: z.number(),
	});
	static flightModes = ["legacy", "nova"];
	static flags: ShipSystemFlags[] = ["heat", "power", "damage"];
	type = "coolantTank" as const;
	allowMultiple = false;

	tankCapacity: number;
	coolantDensity: number;
	coolantSpecificHeat: number;
	pumpBaseFlowRate: number;
	radiatorArea: number;

	constructor(params: Partial<CoolantTankPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.tankCapacity = params.tankCapacity || 1000;
		this.coolantDensity = params.coolantDensity || 1113.2;
		this.coolantSpecificHeat = params.coolantSpecificHeat || 2.42;
		this.pumpBaseFlowRate = params.pumpBaseFlowRate || 40000;
		this.radiatorArea = params.radiatorArea || 1;
	}
}
registerSystem("coolantTank", CoolantTankPlugin);
