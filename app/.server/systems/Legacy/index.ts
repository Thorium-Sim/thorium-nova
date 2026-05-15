import { LegacyBatteryDrainSystem } from "@thorium/.server/systems/Legacy/BatteryDrainSystem";
import { LegacyCoolantSystem } from "@thorium/.server/systems/Legacy/CoolantSystem";
import { LegacyCoolantTransferSystem } from "@thorium/.server/systems/Legacy/CoolantTransferSystem";
import { LegacyEngineHeatPowerSystem } from "@thorium/.server/systems/Legacy/EngineHeatPowerSystem";
import { LegacyReactorHeatSystem } from "@thorium/.server/systems/Legacy/ReactorHeatSystem";
import { LegacySensorContactMovementSystem } from "@thorium/.server/systems/Legacy/SensorContactMovementSystem";
import { LegacySensorProgramSystem } from "@thorium/.server/systems/Legacy/SensorProgramSystem";
import { LegacySensorSonarSystem } from "@thorium/.server/systems/Legacy/SensorSonarSystem";
import { LegacyThrustersSystem } from "@thorium/.server/systems/Legacy/ThrustersSystem";

export const legacySystems = [
	LegacyReactorHeatSystem,
	LegacyEngineHeatPowerSystem,
	LegacyBatteryDrainSystem,
	LegacyThrustersSystem,
	LegacyCoolantTransferSystem,
	LegacyCoolantSystem,
	LegacySensorContactMovementSystem,
	LegacySensorSonarSystem,
	LegacySensorProgramSystem,
];
