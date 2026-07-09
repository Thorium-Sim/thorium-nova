import { sound, type Sound } from "@thorium/ecs-components/sound";
import type { KiloNewtons, MetersPerSecond, RotationsPerMinute } from "@thorium/utils/unitTypes";
import z from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

// TODO March 16, 2022: Add the necessary sound effects
export default class ThrustersPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("thrusters"),
		directionMaxSpeed: z.number(),
		directionThrust: z.number(),
		rotationMaxSpeed: z.number(),
		rotationThrust: z.number(),
		soundEffects: z.object({
			thrust: sound.array().optional(),
		}),
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "thrusters" as const;
	directionMaxSpeed: MetersPerSecond;
	directionThrust: KiloNewtons;
	rotationMaxSpeed: RotationsPerMinute;
	rotationThrust: KiloNewtons;

	soundEffects: {
		thrust: Sound[];
	};
	constructor(params: Partial<ThrustersPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.directionMaxSpeed = params.directionMaxSpeed || 1;
		this.directionThrust = params.directionThrust || 12500;
		this.rotationMaxSpeed = params.rotationMaxSpeed || 5;
		this.rotationThrust = params.rotationThrust || 12500;

		this.soundEffects = params.soundEffects || {
			thrust: [],
		};
	}
}
registerSystem("thrusters", ThrustersPlugin);
