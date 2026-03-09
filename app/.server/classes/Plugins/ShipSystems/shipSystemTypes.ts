import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import WarpEnginesPlugin from "./warpEngines";
import InertialDampenersPlugin from "./InertialDampeners";
import ThrustersPlugin from "./Thrusters";
import ReactorPlugin from "./Reactor";
import BatteryPlugin from "./Battery";
import TorpedoLauncherPlugin from "./TorpedoLauncher";
import TargetingSystemPlugin from "./Targeting";
import ShieldsPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Shields";
import PhasersPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Phasers";
import SensorsPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Sensors";
import MainComputerPlugin from "@thorium/.server/classes/Plugins/ShipSystems/MainComputer";
import CoolantTankSystemPlugin from "@thorium/.server/classes/Plugins/ShipSystems/CoolantTank";
import NavigationPlugin from "@thorium/.server/classes/Plugins/ShipSystems/Navigation";
import LongRangeCommPlugin from "@thorium/.server/classes/Plugins/ShipSystems/LongRangeComm";
import MainCameraPlugin from "@thorium/.server/classes/Plugins/ShipSystems/MainCamera";

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
	mainCamera: MainCameraPlugin,
};

export type ShipSystemFlags = "power" | "heat" | "damage" | "sounds";

export type AllShipSystems = {
	[k in keyof typeof ShipSystemTypes]: InstanceType<
		(typeof ShipSystemTypes)[k]
	>;
};
