import { LegacyThrustersSystem } from "@thorium/.server/systems/Legacy/ThrustersSystem";
import { LegacyReactorHeatSystem } from "@thorium/.server/systems/Legacy/ReactorHeatSystem";
import { LegacyBatteryDrainSystem } from "@thorium/.server/systems/Legacy/BatteryDrainSystem";
import { LegacyCoolantTransferSystem } from "@thorium/.server/systems/Legacy/CoolantTransferSystem";
import { LegacyCoolantSystem } from "@thorium/.server/systems/Legacy/CoolantSystem";
import { LegacySensorContactMovementSystem } from "@thorium/.server/systems/Legacy/SensorContactMovementSystem";
import { LegacySensorSonarSystem } from "@thorium/.server/systems/Legacy/SensorSonarSystem";
import { LegacySensorProgramSystem } from "@thorium/.server/systems/Legacy/SensorProgramSystem";
import { LegacyEngineHeatPowerSystem } from "@thorium/.server/systems/Legacy/EngineHeatPowerSystem";

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
