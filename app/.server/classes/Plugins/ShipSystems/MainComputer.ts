import type { Sound } from "@thorium/ecs-components/sound";
import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class MainComputerPlugin extends BaseShipSystemPlugin {
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
