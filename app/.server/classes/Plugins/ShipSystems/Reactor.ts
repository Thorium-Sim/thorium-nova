import type { Sound } from "@thorium/ecs-components/sound";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

type LegacySetting = {
	name: string;
	efficiency: number | null;
	color: "primary" | "secondary" | "success" | "warning" | "error" | "accent" | "info" | "notice";
};

const defaultLegacySettings: LegacySetting[] = [
	{
		name: "Overload",
		color: "error",
		efficiency: 1.25,
	},
	{
		name: "Cruise",
		color: "primary",
		efficiency: 1,
	},
	{
		name: "Silent Running",
		color: "notice",
		efficiency: 0.87,
	},
	{
		name: "Reduced",
		color: "secondary",
		efficiency: 0.5,
	},
	{
		name: "Auxiliary",
		color: "info",
		efficiency: 0.38,
	},
	{
		name: "Minimal",
		color: "warning",
		efficiency: 0.27,
	},
	{
		name: "Power Down",
		color: "error",
		efficiency: 0,
	},
	{
		name: "External Power",
		color: "success",
		efficiency: null,
	},
];
export default class ReactorPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["damage", "heat", "sounds"];
	type = "reactor" as const;

	/**
	 * What percent of the max output provides a 100% fuel-to-energy conversion.
	 * Any higher output than this decreases overall efficiency,
	 * any lower increases overall efficiency, making fuel last longer.
	 */
	optimalOutputPercent: number;
	/**
	 * Determines the total output of all reactors by multiplying this by all
	 * ship system's default power.
	 */
	powerMultiplier: number;
	/**
	 * The max power output of each reactor is determined by the power
	 * required by all of the systems on the ship divided by the
	 * number of reactors. Maybe with a bit of margin for error, just
	 * in case.
	 */
	reactorCount: number;
	powerUpSpeed: number;
	balancedBonusMultiplier: number;
	/**
	 * For legacy mode: Settings for adjusting the reactor efficiency/output
	 */
	legacySettings: LegacySetting[];
	soundEffects: {
		ambiance: Sound[];
		overheatAlert: Sound[];
	};
	constructor(params: Partial<ReactorPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.optimalOutputPercent = params.optimalOutputPercent || 0.7;
		this.reactorCount = params.reactorCount || 4;
		this.powerMultiplier = params.powerMultiplier || 1;
		this.powerUpSpeed = params.powerUpSpeed || 0.5;
		this.balancedBonusMultiplier = params.balancedBonusMultiplier || 0.9;
		this.legacySettings = params.legacySettings || structuredClone(defaultLegacySettings);
		this.soundEffects = params.soundEffects || {
			ambiance: [],
			overheatAlert: [],
		};
	}
}
registerSystem("reactor", ReactorPlugin);
