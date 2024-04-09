import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import WarpEnginesPlugin from "./warpEngines";
import InertialDampenersPlugin from "./InertialDampeners";
import ThrustersPlugin from "./Thrusters";
import ReactorPlugin from "./Reactor";
import BatteryPlugin from "./Battery";
import { LiteralTuple, TuplifyUnion } from "@server/utils/types";

// Make sure you update teh isShipSystem component when adding a new ship system type
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
};

export type ShipSystemFlags = "power" | "heat" | "efficiency";

export type AllShipSystems = {
	[k in keyof typeof ShipSystemTypes]: InstanceType<
		(typeof ShipSystemTypes)[k]
	>;
};

export type PowerNodes =
	| "offense"
	| "defense"
	| "navigation"
	| "intel"
	| "internal";
