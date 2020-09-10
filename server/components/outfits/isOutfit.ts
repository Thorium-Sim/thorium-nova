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
  };
  @Field()
  outfitType: string = "";
}
