import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType({
  description:
    "This component is used to assign other entities, like systems or crew members, to a ship.",
})
export class ShipAssignment extends Component {
  static id: "shipAssignment" = "shipAssignment";
  static defaults: ComponentOmit<ShipAssignment> = {
    shipId: "",
  };

  @Field()
  shipId: string = "";
}
