import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsShipComponent extends Component {
  static id: "isShip" = "isShip";
  static defaults: ComponentOmit<IsShipComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
