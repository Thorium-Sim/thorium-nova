import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";

export const systemFilterValues = [
	"Propulsion",
	"Defense",
	"Power",
	"Communications",
	"Science",
	"Misc.",
] as const;
export const systemCategories: Record<
	ShipSystemTypes,
	(typeof systemFilterValues)[number]
> = {
	battery: "Power",
	coolantTank: "Misc.",
	generic: "Misc.",
	impulseEngines: "Propulsion",
	inertialDampeners: "Propulsion",
	longRangeComm: "Communications",
	shortRangeComm: "Communications",
	mainComputer: "Science",
	navigation: "Propulsion",
	phasers: "Defense",
	reactor: "Power",
	sensors: "Science",
	shields: "Defense",
	targeting: "Defense",
	thrusters: "Propulsion",
	torpedoLauncher: "Defense",
	warpEngines: "Propulsion",
};

export const systemSortValues = ["Name", "Type", "Offline", "Damage"];
