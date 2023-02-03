import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import WarpEnginesPlugin from "./warpEngines";
import InertialDampenersPlugin from "./InertialDampeners";
import ThrustersPlugin from "./Thrusters";
import ReactorPlugin from "./Reactor";
import BatteryPlugin from "./Battery";

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
