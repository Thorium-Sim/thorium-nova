import { t } from "@thorium/.server/init/t";
import { powerDistribution } from "@thorium/cards/Legacy/PowerDistribution/data.server";
import { thrusters } from "@thorium/cards/Legacy/Thrusters/data.server";

export const legacy = t.router({
	thrusters,
	powerDistribution,
});
