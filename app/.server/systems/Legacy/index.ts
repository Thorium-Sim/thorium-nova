import { LegacyThrustersSystem } from "@thorium/.server/systems/Legacy/ThrustersSystem";
import { LegacyReactorHeatSystem } from "@thorium/.server/systems/Legacy/ReactorHeatSystem";
import { LegacyBatteryDrainSystem } from "@thorium/.server/systems/Legacy/BatteryDrainSystem";

export const legacySystems = [
	LegacyReactorHeatSystem,
	LegacyBatteryDrainSystem,
	LegacyThrustersSystem,
];
