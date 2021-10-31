import {promises as fs} from "fs";
import type BasePlugin from "./index";
import {Aspect} from "./Aspect";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import path from "path";

type ShipCategories = "Cruiser" | "Frigate" | "Scout" | "Shuttle";

export default class ShipPlugin extends Aspect {
  apiVersion = "ships/v1" as const;
  kind = "ships" as const;
  name: string;
  description: string;
  /**
   * A general category of the ship. Used to determine faction icons.
   */
  category: ShipCategories;
  tags: string[];
  /**
   * Asset paths are relative to the Thorium data directory.
   */
  assets: {
    /**
     * The path to the logo image. Best if it's a square image. SVGs are preferred.
     */
    logo: string;
    /**
     * The path to the 3D model. Must be in GLB or GLTF format. See the docs for instructions on how to position your model.
     */
    model: string;
    /**
     * The top view of the ship as a PNG. Usually auto-generated from the model.
     */
    topView: string;
    /**
     * The side view of the ship as a PNG. Usually auto-generated from the model.
     */
    sideView: string;
  };
  /**
   * The mass of the ship in kilograms
   */
  mass: number;
  /**
   * Length of the ship in meters. This is used to scale the 3D model
   * which will be used for determining the width and height of the ship.
   * This determines the size on the viewscreen and the collision hitbox.
   */
  length: number;
  /**
   * The list of ship systems assigned to the ship. Duplicate systems are
   * allowed.
   */
  shipSystems: string[];
  constructor(params: Partial<ShipPlugin>, plugin: BasePlugin) {
    const name = generateIncrementedName(
      params.name || "New Ship",
      plugin.aspects.ships.map(ship => ship.name)
    );
    super({name, ...params}, {kind: "ships"}, plugin);
    this.name = name;
    this.description =
      params.description || "Boldly going where no one has gone before.";
    this.category = params.category || "Cruiser";
    this.tags = params.tags || [];
    this.assets = params.assets || {
      logo: "",
      model: "",
      topView: "",
      sideView: "",
    };
    this.mass = params.mass || 700000000;
    this.length = params.length || 350;
    this.shipSystems = params.shipSystems || [];
  }
  async removeFile() {
    await super.removeFile();
    await fs.rm(path.dirname(this.path), {recursive: true, force: true});
  }
  async rename(name: string) {
    if (name.trim() === this.name) return;
    const newName = generateIncrementedName(
      name.trim() || this.name,
      this.plugin.aspects.ships.map(ship => ship.name)
    );
    console.log(this.path);
    // await fs.rename(
    //   `${thoriumPath}/plugins/${this.name}`,
    //   `${thoriumPath}/plugins/${newName}`
    // );
    // this.id = newName;
    // this.name = newName;
    // this.path = `/plugins/${newName}/manifest.yml`;

    // // Also rename the cover image
    // const coverImage = path.basename(this.coverImage);
    // this.coverImage = this.assetPath(coverImage);
    // // TODO October 29, 2021: Rename all of the assets associated with
    // // aspects of this plugin too.

    // await this.writeFile(true);
  }
}
