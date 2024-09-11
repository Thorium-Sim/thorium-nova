import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

// TODO March 16, 2022: Add the necessary sound effects
export default class PhasersPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
	type = "phasers" as const;
	allowMultiple = true;

	maxRange: number;
	maxArc: number;
	headingDegree: number;
	pitchDegree: number;

	yieldMultiplier: number;

	constructor(params: Partial<PhasersPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.maxRange = params.maxRange ?? 10000;
		this.maxArc = params.maxArc ?? 90;
		this.headingDegree = params.headingDegree ?? 0;
		this.pitchDegree = params.pitchDegree ?? 0;

		this.yieldMultiplier = params.yieldMultiplier ?? 1;
	}
}
registerSystem("phasersPlugin", PhasersPlugin);
