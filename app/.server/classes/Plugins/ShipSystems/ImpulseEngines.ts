import { engineSpeeds, type EngineSpeed } from "@thorium/ecs-components/shipSystems/engineSpeeds";
import { sound, type Sound } from "@thorium/ecs-components/sound";
import type { KilometerPerSecond, KilometerPerSecondSquared } from "@thorium/utils/unitTypes";
import z from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class ImpulseEnginesPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("impulseEngines"),
		cruisingSpeed: z.number(),
		emergencySpeed: z.number(),
		acceleration: z.number(),
		speeds: engineSpeeds,
		soundEffects: z.object({
			powerUp: sound.array().optional(),
			powerDown: sound.array().optional(),
			ambiance: sound.array().optional(),
		}),
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "impulseEngines" as const;
	cruisingSpeed: KilometerPerSecond;
	emergencySpeed: KilometerPerSecond;
	acceleration: KilometerPerSecondSquared;

	speeds: EngineSpeed[];

	soundEffects: {
		powerUp: Sound[];
		powerDown: Sound[];
		ambiance: Sound[];
	};
	constructor(params: Partial<ImpulseEnginesPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.cruisingSpeed = params.cruisingSpeed || 1500;
		this.emergencySpeed = params.emergencySpeed || 2000;
		this.acceleration = params.acceleration || 625;
		this.speeds = params.speeds || [
			{ label: "1/4 Impulse", number: "0.25" },
			{ label: "1/2 Impulse", number: "0.5" },
			{ label: "3/4 Impulse", number: "0.75" },
			{ label: "Full Impulse", number: "1.0" },
			{ label: "Destructive", number: "1.25" },
		];
		this.soundEffects = params.soundEffects ?? {
			powerUp: [],
			powerDown: [],
			ambiance: [],
		};
	}
}
registerSystem("impulseEngines", ImpulseEnginesPlugin);
