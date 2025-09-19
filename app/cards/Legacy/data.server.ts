import { t } from "@thorium/.server/init/t";
import { coolantControl } from "@thorium/cards/Legacy/CoolantControl/data.server";
import { powerDistribution } from "@thorium/cards/Legacy/PowerDistribution/data.server";
import { reactorControl } from "@thorium/cards/Legacy/ReactorControl/data.server";
import { sensorGrid } from "@thorium/cards/Legacy/SensorGrid/data.server";
import { thrusters } from "@thorium/cards/Legacy/Thrusters/data.server";
import { sensorScans } from "@thorium/cards/Legacy/SensorScans/data.server";

export const legacy = t.router({
	thrusters,
	powerDistribution,
	reactorControl,
	coolantControl,
	sensorGrid,
	sensorScans,
});
