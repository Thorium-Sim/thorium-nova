import CoolantTankSystemPlugin from "@thorium/.server/classes/Plugins/ShipSystems/CoolantTank";
import ExocompsPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Exocomps";
import LongRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/LongRangeComm";
import MainComputerPlugin from "@thorium/.server/classes/Plugins/ShipSystems/MainComputer";
import NavigationPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Navigation";
import PhasersPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Phasers";
import SensorsPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Sensors";
import ShieldsPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Shields";

import BatteryPlugin from "./Battery";
import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import InertialDampenersPlugin from "./InertialDampeners";
import ReactorPlugin from "./Reactor";
import ShortRangeCommPlugin from "./ShortRangeComm";
import TargetingSystemPlugin from "./Targeting";
import ThrustersPlugin from "./Thrusters";
import TorpedoLauncherPlugin from "./TorpedoLauncher";
import WarpEnginesPlugin from "./warpEngines";

// Make sure you update the isShipSystem component when adding a new ship system type
// We can't derive the isShipSystem list from this list because ECS components
// are imported in the browser as well as the server.
export const ShipSystemTypes = {
	warpEngines: WarpEnginesPlugin,
	impulseEngines: ImpulseEnginesPlugin,
	generic: GenericSystemPlugin,
	inertialDampeners: InertialDampenersPlugin,
	thrusters: ThrustersPlugin,
	reactor: ReactorPlugin,
	battery: BatteryPlugin,
	torpedoLauncher: TorpedoLauncherPlugin,
	targeting: TargetingSystemPlugin,
	shields: ShieldsPlugin,
	phasers: PhasersPlugin,
	sensors: SensorsPlugin,
	mainComputer: MainComputerPlugin,
	coolantTank: CoolantTankSystemPlugin,
	navigation: NavigationPlugin,
	longRangeComm: LongRangeCommPlugin,
	shortRangeComm: ShortRangeCommPlugin,
	exocomps: ExocompsPlugin,
};

export type ShipSystemFlags = "power" | "heat" | "damage" | "sounds";

export type AllShipSystems = {
	[k in keyof typeof ShipSystemTypes]: InstanceType<(typeof ShipSystemTypes)[k]>;
};
