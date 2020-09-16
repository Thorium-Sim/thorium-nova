import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {GraphQLContext} from "server/helpers/graphqlContext";
import {
  Ctx,
  Field,
  FieldResolver,
  ObjectType,
  Resolver,
  Root,
} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class IsOutfitComponent extends Component {
  static id: "isOutfit" = "isOutfit";
  static defaults: ComponentOmit<IsOutfitComponent> = {
    outfitType: "",
    assignedShipId: "",
    assignedShip: null,
  };
  @Field()
  outfitType: string = "";

  @Field()
  assignedShipId: string = "";
  @Field(type => Entity, {nullable: true})
  get assignedShip(): Entity | null {
    return (
      App.activeFlight?.ships.find(e => e.id === this.assignedShipId) || null
    );
  }
}
