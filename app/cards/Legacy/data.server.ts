import { t } from "@thorium/.server/init/t";
import { coolantControl } from "@thorium/cards/Legacy/CoolantControl/data.server";
import { engineControl } from "@thorium/cards/Legacy/EngineControl/data.server";
import { navigation } from "@thorium/cards/Legacy/Navigation/data.server";
import { powerDistribution } from "@thorium/cards/Legacy/PowerDistribution/data.server";
import { reactorControl } from "@thorium/cards/Legacy/ReactorControl/data.server";
import { sensorGrid } from "@thorium/cards/Legacy/SensorGrid/data.server";
import { sensorScans } from "@thorium/cards/Legacy/SensorScans/data.server";
import { thrusters } from "@thorium/cards/Legacy/Thrusters/data.server";

export const legacy = t.router({
	thrusters,
	powerDistribution,
	reactorControl,
	coolantControl,
	sensorGrid,
	sensorScans,
	navigation,
	engineControl,
});
