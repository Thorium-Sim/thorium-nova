import z from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class NavigationPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("navigation"),
		calculate: z.boolean(),
		thrusters: z.boolean(),
		destinations: z.string().array(),
		presets: z
			.object({
				name: z.string(),
				course: z.object({ x: z.number(), y: z.number(), z: z.number() }),
			})
			.array(),
	});
	static flags: ShipSystemFlags[] = ["damage", "power"];
	type = "navigation" as const;
	calculate: boolean;
	thrusters: boolean;
	destinations: string[];
	presets: { name: string; course: { x: number; y: number; z: number } }[];
	constructor(params: Partial<NavigationPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.calculate = params.calculate ?? true;
		this.thrusters = params.thrusters || false;
		this.destinations = params.destinations || [];
		this.presets = params.presets || [];
	}
}
registerSystem("navigation", NavigationPlugin);
