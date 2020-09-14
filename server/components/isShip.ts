import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsShipComponent extends Component {
  static id: "isShip" = "isShip";
  static defaults: ComponentOmit<IsShipComponent> = {
    mass: 2000,
  };

  @Field({description: "Mass in kilograms. Affects acceleration"})
  mass: number = 2000;
}
