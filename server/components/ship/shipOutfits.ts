import Entity from "server/helpers/ecs/entity";
import {getAnyOutfit} from "server/schema/plugins/outfits/utils";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

function isOutfit(entity: any): entity is Entity {
  return entity && entity.id && entity.isOutfit;
}
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
    return this.outfitIds.map(o => getAnyOutfit(o)).filter(isOutfit);
  }
}
