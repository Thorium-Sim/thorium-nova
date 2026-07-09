import { engineSpeeds, type EngineSpeed } from "@thorium/ecs-components/shipSystems/engineSpeeds";
import type { KilometerPerSecond } from "@thorium/utils/unitTypes";
import { z } from "zod";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { baseShipSystemSchema, registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

// TODO May 3, 2022: Add the necessary sound effects
export default class WarpEnginesPlugin extends BaseShipSystemPlugin {
	static schema = baseShipSystemSchema.extend({
		type: z.literal("warpEngines"),
		interstellarCruisingSpeed: z.number(),
		solarCruisingSpeed: z.number(),
		minSpeedMultiplier: z.number(),
		speeds: engineSpeeds,
	});
	static flags: ShipSystemFlags[] = ["damage", "heat", "power"];
	type = "warpEngines" as const;
	/** The cruising speed in interstellar space in km/s */
	interstellarCruisingSpeed: KilometerPerSecond;
	/** The cruising speed in solar system space in km/s */
	solarCruisingSpeed: KilometerPerSecond;
	/** The min speed (warp 1) compared to the cruising speed. Defaults to 0.01 */
	minSpeedMultiplier: number;
	speeds: EngineSpeed[];
	constructor(params: Partial<WarpEnginesPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.interstellarCruisingSpeed = params.interstellarCruisingSpeed || 599_600_000_000;
		this.solarCruisingSpeed = params.solarCruisingSpeed || 29_980_000;
		this.minSpeedMultiplier = params.minSpeedMultiplier || 0.01;
		this.speeds = params.speeds || [
			{ label: "Warp 1", number: "1" },
			{ label: "Warp 2", number: "2" },
			{ label: "Warp 3", number: "3" },
			{ label: "Warp 4", number: "4" },
			{ label: "Warp 5", number: "5" },
			{ label: "Destructive", number: "!!" },
		];
	}
}
registerSystem("warpEngines", WarpEnginesPlugin);
