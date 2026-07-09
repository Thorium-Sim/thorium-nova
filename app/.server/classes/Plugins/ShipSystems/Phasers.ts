import { sound, type Sound } from "@thorium/ecs-components/sound";
import { z } from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class PhasersPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("phasers"),
		maxRange: z.number(),
		maxArc: z.number(),
		headingDegree: z.number(),
		pitchDegree: z.number(),

		fullChargeYield: z.number(),
		yieldMultiplier: z.number(),

		legacyPhaserBanks: z.number(),
		legacyChargeSpeed: z.number(),

		soundEffects: z.object({
			fire: sound.array().optional(),
		}),
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "phasers" as const;
	allowMultiple = true;

	maxRange: number;
	maxArc: number;
	headingDegree: number;
	pitchDegree: number;

	fullChargeYield: number;
	yieldMultiplier: number;

	legacyPhaserBanks: number;
	legacyChargeSpeed: number;

	soundEffects: {
		fire: Sound[];
	};

	constructor(params: Partial<PhasersPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.maxRange = params.maxRange ?? 10000;
		this.maxArc = params.maxArc ?? 90;
		this.headingDegree = params.headingDegree ?? 0;
		this.pitchDegree = params.pitchDegree ?? 0;

		this.fullChargeYield = params.fullChargeYield ?? 1;

		this.yieldMultiplier = params.yieldMultiplier ?? 1;

		this.legacyPhaserBanks = params.legacyPhaserBanks ?? 2;
		this.legacyChargeSpeed = params.legacyChargeSpeed ?? 1;

		this.soundEffects = params.soundEffects ?? {
			fire: [],
		};
	}
}
registerSystem("phasersPlugin", PhasersPlugin);
