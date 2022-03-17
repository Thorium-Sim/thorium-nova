import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import {Aspect} from "../Aspect";
import BasePlugin from "..";
import {ShipSystemTypes, ShipSystemFlags} from "./shipSystemTypes";

/**
 * The base class to use when creating system plugins
 *
 * Eventually this will include generic properties for power, heat, and efficiency
 */
export default class BaseShipSystemPlugin extends Aspect {
  static flags: ShipSystemFlags[] = ["efficiency", "heat", "power"];
  apiVersion = "shipSystems/v1" as const;
  kind = "shipSystems" as const;
  name: string;
  description: string;
  type: keyof typeof ShipSystemTypes;
  tags: string[];
  /**
   * Extend the sub-class to include the specific images and sound effects
   * for this system
   */
  assets: {};
  constructor(params: Partial<BaseShipSystemPlugin>, plugin: BasePlugin) {
    const name = generateIncrementedName(
      params.name || `New ${params.type}`,
      plugin.aspects.shipSystems.map(sys => sys.name)
    );
    super({name, ...params}, {kind: "shipSystems"}, plugin);
    this.name = name || "";
    this.type = params.type || "generic";
    this.description = params.description || "";
    this.tags = params.tags || [];
    this.assets = params.assets || {
      soundEffects: [],
    };
  }
}
