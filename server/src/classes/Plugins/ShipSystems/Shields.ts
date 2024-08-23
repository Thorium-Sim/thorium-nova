import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export type ShieldDirections =
	| "fore"
	| "aft"
	| "starboard"
	| "port"
	| "dorsal"
	| "ventral";

// TODO March 16, 2022: Add the necessary sound effects
export default class ShieldsPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
	type = "shields" as const;

	maxStrength: number;
	shieldCount: 1 | 4 | 6;

	constructor(params: Partial<ShieldsPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.maxStrength = params.maxStrength || 5;
		this.shieldCount = params.shieldCount || 1;
	}
}
registerSystem("shields", ShieldsPlugin);

export function getWhichShield(
	direction: { x: number; y: number; z: number },
	size: { x: number; y: number; z: number },
): ShieldDirections {
	// Scale direction based on the size of the ship
	const x = Math.abs(direction.x / size.x);
	const y = Math.abs(direction.y / size.y);
	const z = Math.abs(direction.z / size.z);
	const max = Math.max(x, y, z);
	if (max === x && max > 0) return "starboard";
	if (max === x && max < 0) return "port";
	if (max === z && max > 0) return "fore";
	if (max === z && max < 0) return "aft";
	if (max === y && max > 0) return "ventral";
	if (max === y && max < 0) return "dorsal";
	// Default to fore in the very unlikely event that the direction is 0,0,0
	return "fore";
}
