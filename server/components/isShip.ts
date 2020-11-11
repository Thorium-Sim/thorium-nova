import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsShipComponent extends Component {
  static id: "isShip" = "isShip";
  static defaults: ComponentOmit<IsShipComponent> = {
    mass: 2000,
    category: "Cruiser",
    nameGeneratorPhrase: null,
  };
  #category: string = "Cruiser";
  @Field({description: "Mass in kilograms. Affects acceleration"})
  mass: number = 2000;

  @Field(type => String, {
    description:
      "The category of the ship, eg. station, fighter, shuttle, cruiser, carrier, etc.",
  })
  get category(): string {
    return this.#category || "Cruiser";
  }
  set category(cat) {
    this.#category = cat;
  }
  @Field(type => String, {nullable: true})
  nameGeneratorPhrase: string | null = null;
}
