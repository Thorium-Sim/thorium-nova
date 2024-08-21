import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

// TODO March 16, 2022: Add the necessary sound effects
export default class ShieldsPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
	type = "shields" as const;

	maxStrength: number;

	constructor(params: Partial<ShieldsPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.maxStrength = params.maxStrength || 5;
	}
}
registerSystem("shields", ShieldsPlugin);
