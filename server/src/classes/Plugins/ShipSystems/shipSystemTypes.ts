import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import WarpEnginesPlugin from "./warpEngines";
import InertialDampenersPlugin from "./InertialDampeners";
import ThrustersPlugin from "./Thrusters";

export const ShipSystemTypes = {
  warpEngines: WarpEnginesPlugin,
  impulseEngines: ImpulseEnginesPlugin,
  generic: GenericSystemPlugin,
  inertialDampeners: InertialDampenersPlugin,
  thrusters: ThrustersPlugin,
};

export type ShipSystemFlags = "power" | "heat" | "efficiency";

export type AllShipSystems = {
  [k in keyof typeof ShipSystemTypes]: InstanceType<typeof ShipSystemTypes[k]>;
};
