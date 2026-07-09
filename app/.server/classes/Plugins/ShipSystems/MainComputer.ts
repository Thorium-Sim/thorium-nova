import { sound, type Sound } from "@thorium/ecs-components/sound";
import { z } from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class MainComputerPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("mainComputer"),
		minDiagnosticEnergyCost: z.number(),
		maxDiagnosticEnergyCost: z.number(),

		soundEffects: z.object({
			ambiance: sound.array().optional(),
			diagnosticComplete: sound.array().optional(),
		}),
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "mainComputer" as const;

	minDiagnosticEnergyCost: number;
	maxDiagnosticEnergyCost: number;

	soundEffects: {
		ambiance: Sound[];
		diagnosticComplete: Sound[];
	};
	constructor(params: Partial<MainComputerPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.minDiagnosticEnergyCost = params.minDiagnosticEnergyCost || 5;
		this.maxDiagnosticEnergyCost = params.maxDiagnosticEnergyCost || 15;

		this.soundEffects = params.soundEffects || {
			ambiance: [],
			diagnosticComplete: [],
		};
	}
}
registerSystem("mainComputer", MainComputerPlugin);
