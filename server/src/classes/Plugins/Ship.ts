import type BasePlugin from "./index";
import {FSDataStore} from "@thorium/db-fs";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";

type ShipCategories = "Cruiser" | "Frigate" | "Scout" | "Shuttle";

abstract class Aspect extends FSDataStore {
  abstract apiVersion: string;
  abstract kind: string;
  abstract name: string;
  plugin: BasePlugin;
  constructor(params: {name: string}, plugin: BasePlugin) {
    const name = generateIncrementedName(
      params.name || "New Ship",
      plugin.aspects.ships.map(ship => ship.name)
    );
    super(params, {
      path: `/plugins/${plugin.id}/Ships/${name}/manifest.yml`,
    });
    this.plugin = plugin;
  }

  serialize() {
    const {plugin, ...data} = this;
    return data;
  }
}

export default class ShipPlugin extends Aspect {
  apiVersion = "ship/v1" as const;
  kind = "ship" as const;
  name = "Unnamed Ship";
  description = "Boldly going where no one has gone before.";
  /**
   * A general category of the ship. Used to determine faction icons.
   */
  category: ShipCategories = "Cruiser";
  tags: string[] = [];
  /**
   * Asset paths are relative to the Thorium data directory.
   */
  assets = {
    /**
     * The path to the logo image. Best if it's a square image. SVGs are preferred.
     */
    logo: "",
    /**
     * The path to the 3D model. Must be in GLB or GLTF format. See the docs for instructions on how to position your model.
     */
    model: "",
    /**
     * The top view of the ship as a PNG. Usually auto-generated from the model.
     */
    topView: "",
    /**
     * The side view of the ship as a PNG. Usually auto-generated from the model.
     */
    sideView: "",
  };
  /**
   * The mass of the ship in kilograms
   */
  mass = 700000000;
  /**
   * Length of the ship in meters. This is used to scale the 3D model
   * which will be used for determining the width and height of the ship.
   * This determines the size on the viewscreen and the collision hitbox.
   */
  length = 350;
  /**
   * The list of ship systems assigned to the ship. Duplicate systems are
   * allowed.
   */
  shipSystems: string[] = [];
  /**
   * This is a reference to the parent plugin. It's an ES Private field
   * which automatically removes it when the class is serialized.
   */
  constructor(
    params: {name: string} & Partial<ShipPlugin> = {name: "New Ship"},
    plugin: BasePlugin
  ) {
    super(params, plugin);
    console.log(this.plugin.assetPath("test"));
  }
}
