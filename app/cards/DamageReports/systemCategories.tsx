import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";

export const systemFilterValues = [
	"Propulsion",
	"Defense",
	"Power",
	"Communications",
	"Science",
	"Misc.",
] as const;
export const systemCategories: Record<ShipSystemTypes, (typeof systemFilterValues)[number]> = {
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
	exocomps: "Misc.",
};

export const systemSortValues = ["Name", "Type", "Offline", "Damage"];

// Order that systems will be auto-deactivated, highest number is lowest priority
export const systemPowerPriority: Record<ShipSystemTypes, number> = {
	// Life support will go here someday
	mainComputer: 2,
	longRangeComm: 3,
	sensors: 4,
	shortRangeComm: 5,
	shields: 6,
	inertialDampeners: 7,
	thrusters: 8,
	impulseEngines: 9,
	navigation: 10,
	coolantTank: 11,
	exocomps: 12,
	targeting: 13,
	warpEngines: 14,
	phasers: 15,
	torpedoLauncher: 16,
	generic: 17,
	battery: 1000,
	reactor: 1000,
};
