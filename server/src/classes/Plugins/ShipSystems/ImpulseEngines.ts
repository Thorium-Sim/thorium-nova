import type {
	KilometerPerSecond,
	KiloNewtons,
} from "server/src/utils/unitTypes";
import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";
import type { Sound } from "@server/components/sound";

export default class ImpulseEnginesPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["efficiency", "heat", "power", "sounds"];
	type = "impulseEngines" as const;
	cruisingSpeed: KilometerPerSecond;
	emergencySpeed: KilometerPerSecond;
	thrust: KiloNewtons;

	soundEffects: {
		powerUp: Sound[];
		powerDown: Sound[];
		ambiance: Sound[];
	};
	constructor(params: Partial<ImpulseEnginesPlugin>, plugin: BasePlugin) {
		super(params, plugin);
		this.cruisingSpeed = params.cruisingSpeed || 1500;
		this.emergencySpeed = params.emergencySpeed || 2000;
		this.thrust = params.thrust || 12500;
		this.soundEffects = params.soundEffects ?? {
			powerUp: [],
			powerDown: [],
			ambiance: [],
		};
	}
}
registerSystem("impulseEngines", ImpulseEnginesPlugin);
