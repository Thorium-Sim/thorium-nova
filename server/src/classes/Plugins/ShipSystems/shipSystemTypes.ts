import GenericSystemPlugin from "./Generic";
import ImpulseEnginesPlugin from "./ImpulseEngines";
import WarpEnginesPlugin from "./warpEngines";

export const ShipSystemTypes = {
  warpEngines: WarpEnginesPlugin,
  impulseEngines: ImpulseEnginesPlugin,
  generic: GenericSystemPlugin,
};

export type ShipSystemFlags = "power" | "heat" | "efficiency";

export type AllShipSystems = {
  [k in keyof typeof ShipSystemTypes]: InstanceType<typeof ShipSystemTypes[k]>;
};
