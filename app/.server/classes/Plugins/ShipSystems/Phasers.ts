import type { Sound } from "@thorium/ecs-components/sound";
import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class PhasersPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "phasers" as const;
	allowMultiple = true;

	maxRange: number;
	maxArc: number;
	headingDegree: number;
	pitchDegree: number;

	fullChargeYield: number;
	yieldMultiplier: number;

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

		this.soundEffects = params.soundEffects ?? {
			fire: [],
		};
	}
}
registerSystem("phasersPlugin", PhasersPlugin);
