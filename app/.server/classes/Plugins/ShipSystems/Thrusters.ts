import type {
	KiloNewtons,
	MetersPerSecond,
	RotationsPerMinute,
} from "@thorium/utils/unitTypes";
import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";
import type { Sound } from "@thorium/ecs-components/sound";

// TODO March 16, 2022: Add the necessary sound effects
export default class ThrustersPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["damage", "heat", "power", "sounds"];
	type = "thrusters" as const;
	directionMaxSpeed: MetersPerSecond;
	directionThrust: KiloNewtons;
	rotationMaxSpeed: RotationsPerMinute;
	rotationThrust: KiloNewtons;

	soundEffects: {
		thrust: Sound[];
	};
	constructor(params: Partial<ThrustersPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.directionMaxSpeed = params.directionMaxSpeed || 1;
		this.directionThrust = params.directionThrust || 12500;
		this.rotationMaxSpeed = params.rotationMaxSpeed || 5;
		this.rotationThrust = params.rotationThrust || 12500;

		this.soundEffects = params.soundEffects || {
			thrust: [],
		};
	}
}
registerSystem("thrusters", ThrustersPlugin);
