import type { Sound } from "@thorium/ecs-components/sound";
import type { Liter, MegaWatt, MegaWattHour, MetersPerSecond } from "@thorium/utils/unitTypes";

import type BasePlugin from "..";
import BaseShipSystemPlugin, { registerSystem } from "./BaseSystem";
import type { ShipSystemFlags } from "./shipSystemTypes";

export default class ExocompsPlugin extends BaseShipSystemPlugin {
	static flags: ShipSystemFlags[] = ["damage", "power", "sounds"];
	type = "exocomps" as const;
	exocompName: string;
	exocompCount: number;

	exocompMaxCharge: MegaWattHour;
	exocompChargeRate: MegaWatt;
	exocompIdleDischargeRate: MegaWatt;
	exocompWorkingDischargeRate: MegaWatt;
	exocompMovingDischargeRate: MegaWatt;

	exocompMovementSpeed: MetersPerSecond;
	exocompCargoVolume: Liter;
	soundEffects: {
		error: Sound[];
		success: Sound[];
	};
	constructor(params: Partial<ExocompsPlugin>, plugin: BasePlugin) {
		super(params, plugin);

		this.exocompName = params.exocompName || "Exocomp";
		this.exocompCount = params.exocompCount || 3;

		this.exocompMaxCharge = params.exocompMaxCharge || 0.5;
		this.exocompChargeRate = params.exocompChargeRate || 2;
		this.exocompIdleDischargeRate = params.exocompIdleDischargeRate || 0.1;
		this.exocompWorkingDischargeRate = params.exocompWorkingDischargeRate || 1;
		this.exocompMovingDischargeRate = params.exocompMovingDischargeRate || 0.2;
		this.exocompMovementSpeed = params.exocompMovementSpeed || 3;
		this.exocompCargoVolume = params.exocompCargoVolume || 50;
		this.soundEffects = params.soundEffects || {
			error: [],
			success: [],
		};
	}
}
registerSystem("exocomps", ExocompsPlugin);
