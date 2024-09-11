import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import WarpEnginesPlugin from "./warpEngines";
import InertialDampenersPlugin from "./InertialDampeners";
import ThrustersPlugin from "./Thrusters";
import ReactorPlugin from "./Reactor";
import BatteryPlugin from "./Battery";
import TorpedoLauncherPlugin from "./TorpedoLauncher";
import TargetingSystemPlugin from "./Targeting";
import ShieldsPlugin from "@server/classes/Plugins/ShipSystems/Shields";
import PhasersPlugin from "@server/classes/Plugins/ShipSystems/Phasers";

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
};

export type ShipSystemFlags = "power" | "heat" | "efficiency";

export type AllShipSystems = {
	[k in keyof typeof ShipSystemTypes]: InstanceType<
		(typeof ShipSystemTypes)[k]
	>;
};
