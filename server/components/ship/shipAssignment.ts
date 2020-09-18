import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType({
  description:
    "This component is used to assign other entities, like systems or crew members, to a ship.",
})
export class ShipAssignmentComponent extends Component {
  static id: "shipAssignment" = "shipAssignment";
  static defaults: ComponentOmit<ShipAssignmentComponent> = {
    shipId: "",
    ship: null,
  };

  @Field()
  shipId: string = "";

  @Field(type => Entity, {nullable: true})
  ship: Entity | null = null;
}
