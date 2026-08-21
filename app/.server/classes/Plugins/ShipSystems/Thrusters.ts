import { sound, type Sound } from "@thorium/ecs-components/sound";
import type {
	KilometerPerSecondSquared,
	MetersPerSecond,
	RotationsPerMinute,
} from "@thorium/utils/unitTypes";
import z from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class ThrustersPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("thrusters"),
		directionMaxSpeed: z.number(),
		directionAcceleration: z.number(),
		rotationMaxSpeed: z.number(),
		rotationAcceleration: z.number(),
		soundEffects: z.object({
			thrust: sound.array().optional(),
		}),
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "thrusters" as const;
	directionMaxSpeed: MetersPerSecond;
	directionAcceleration: KilometerPerSecondSquared;
	rotationMaxSpeed: RotationsPerMinute;
	rotationAcceleration: KilometerPerSecondSquared;

	soundEffects: {
		thrust: Sound[];
	};
	constructor(params: Partial<ThrustersPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.directionMaxSpeed = params.directionMaxSpeed || 1;
		this.directionAcceleration = params.directionAcceleration || 625;
		this.rotationMaxSpeed = params.rotationMaxSpeed || 5;
		this.rotationAcceleration = params.rotationAcceleration || 625;

		this.soundEffects = params.soundEffects || {
			thrust: [],
		};
	}
}
registerSystem("thrusters", ThrustersPlugin);
