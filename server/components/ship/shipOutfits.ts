import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType({
  description:
    "This component defines the outfits which are assigned to a ship. When a flight is started, the outfit IDs are converted into references to the actual outfit IDs",
})
export class ShipOutfitsComponent extends Component {
  static id: "shipOutfits" = "shipOutfits";
  static defaults: ComponentOmit<ShipOutfitsComponent> = {
    outfitIds: [],
    outfits: [],
  };

  @Field(type => [String])
  outfitIds: string[] = [];

  @Field(type => [Entity])
  get outfits(): Entity[] {
    // TODO: Make this get the actual outfits of the ship
    return [];
  }
}
