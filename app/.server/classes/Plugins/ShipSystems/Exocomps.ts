import { sound, type Sound } from "@thorium/ecs-components/sound";
import type { Liter, MegaWatt, MegaWattHour, MetersPerSecond } from "@thorium/utils/unitTypes";
import z from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class ExocompsPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("exocomps"),
		exocompName: z.string(),
		exocompCount: z.number(),

		exocompMaxCharge: z.number(),
		exocompChargeRate: z.number(),
		exocompIdleDischargeRate: z.number(),
		exocompWorkingDischargeRate: z.number(),
		exocompMovingDischargeRate: z.number(),

		exocompMovementSpeed: z.number(),
		exocompCargoVolume: z.number(),
		soundEffects: z.object({ error: sound.array(), success: sound.array() }),
	});
	static flags: ShipSystemFlags[] = ["damage", "power", "sounds"];
	type = "exocomps" as const;
	exocompName: string;
	exocompCount: number;

	exocompMaxCharge: MegaWattHour;
	exocompChargeRate: MegaWatt;
	exocompIdleDischargeRate: MegaWatt;
	exocompWorkingDischargeRate: MegaWatt;
	exocompMovingDischargeRate: MegaWatt;

	exocompMovementSpeed: MetersPerSecond;
	exocompCargoVolume: Liter;
	soundEffects: {
		error: Sound[];
		success: Sound[];
	};
	constructor(params: Partial<ExocompsPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.exocompName = params.exocompName || "Exocomp";
		this.exocompCount = params.exocompCount || 3;

		this.exocompMaxCharge = params.exocompMaxCharge || 0.5;
		this.exocompChargeRate = params.exocompChargeRate || 2;
		this.exocompIdleDischargeRate = params.exocompIdleDischargeRate || 0.1;
		this.exocompWorkingDischargeRate = params.exocompWorkingDischargeRate || 1;
		this.exocompMovingDischargeRate = params.exocompMovingDischargeRate || 0.2;
		this.exocompMovementSpeed = params.exocompMovementSpeed || 3;
		this.exocompCargoVolume = params.exocompCargoVolume || 50;
		this.soundEffects = params.soundEffects || {
			error: [],
			success: [],
		};
	}
}
registerSystem("exocomps", ExocompsPlugin);
