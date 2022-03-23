import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";

export const ShipSystemTypes = {
  impulseEngines: ImpulseEnginesPlugin,
  generic: GenericSystemPlugin,
};

export type ShipSystemFlags = "power" | "heat" | "efficiency";

export type AllShipSystems = {
  [k in keyof typeof ShipSystemTypes]: InstanceType<typeof ShipSystemTypes[k]>;
};
