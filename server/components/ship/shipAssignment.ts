import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType({
  description:
    "This component is used to assign other entities, like systems or crew members, to a ship.",
})
export class ShipAssignmentComponent extends Component {
  static id: "shipAssignment" = "shipAssignment";
  static defaults: ComponentOmit<Partial<ShipAssignmentComponent>> = {
    shipId: "",
  };

  @Field()
  shipId: string = "";

  // Ship used for testing
  #testShip!: Entity;

  @Field(type => Entity, {nullable: true})
  get ship(): Entity | null {
    if (this.#testShip) return this.#testShip;
    return App.activeFlight?.ships.find(s => s.id === this.shipId) || null;
  }
  set ship(ship: Entity | null) {
    if (ship?.id === "test") {
      this.#testShip = ship;
    }
  }
}
