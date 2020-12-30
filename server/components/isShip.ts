import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsShipComponent extends Component {
  static id: "isShip" = "isShip";
  static defaults: ComponentOmit<IsShipComponent> = {
    mass: 2000,
    category: "Cruiser",
    shipClass: "Astra Battleship",
    registry: "NCC-",
    nameGeneratorPhrase: null,
  };
  private _category: string = "Cruiser";
  @Field({description: "Mass in kilograms. Affects acceleration"})
  mass: number = 2000;
  @Field({
    nullable: true,
    description: "The class of the ship. This only applies to spawned ships.",
  })
  shipClass: string = "Astra Battleship";
  @Field({
    nullable: true,
    description:
      "The registry number of the ship. For ship templates, it is a prefix; for spawned ships, it is the fully generated number, based on a hash of the ship's name.",
  })
  registry: string = "NCC-";

  @Field(type => String, {
    description:
      "The category of the ship, eg. station, fighter, shuttle, cruiser, carrier, etc.",
  })
  get category(): string {
    return this._category || "Cruiser";
  }
  set category(cat) {
    this._category = cat;
  }
  @Field(type => String, {nullable: true})
  nameGeneratorPhrase: string | null = null;
}
