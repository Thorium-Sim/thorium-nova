import type { Sound } from "@thorium/ecs-components/sound";
import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class SensorsPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "sensors" as const;

	passiveRange: number;
	activeRange: number;
	minScanEnergyCost: number;
	maxScanEnergyCost: number;
	shieldPenaltyMultiplier: number;

	soundEffects: {
		ambiance: Sound[];
		scanComplete: Sound[];
	};
	constructor(params: Partial<SensorsPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.passiveRange = params.passiveRange || 1_000_000;
		this.activeRange = params.activeRange || 100_000;
		this.minScanEnergyCost = params.minScanEnergyCost || 5;
		this.maxScanEnergyCost = params.maxScanEnergyCost || 15;
		this.shieldPenaltyMultiplier = params.shieldPenaltyMultiplier || 2;

		this.soundEffects = params.soundEffects || {
			ambiance: [],
			scanComplete: [],
		};
	}
}
registerSystem("sensors", SensorsPlugin);
