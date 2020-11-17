import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class IsPlayerShipComponent extends Component {
  static id: "isPlayerShip" = "isPlayerShip";
  static defaults: ComponentOmit<IsPlayerShipComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
