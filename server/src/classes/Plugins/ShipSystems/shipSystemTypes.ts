import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import InertialDampenersPlugin from "./InertialDampeners";

export const ShipSystemTypes = {
  impulseEngines: ImpulseEnginesPlugin,
  generic: GenericSystemPlugin,
  inertialDampeners: InertialDampenersPlugin,
};

export type ShipSystemFlags = "power" | "heat" | "efficiency";

export type AllShipSystems = {
  [k in keyof typeof ShipSystemTypes]: InstanceType<typeof ShipSystemTypes[k]>;
};
