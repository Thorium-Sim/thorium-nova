import {GraphQLContext} from "server/helpers/graphqlContext";
import {Ctx, Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class IsOutfitComponent extends Component {
  static id: "isOutfit" = "isOutfit";
  static defaults: ComponentOmit<IsOutfitComponent> = {
    value: true,
    outfitType: "",
  };

  @Field()
  value: true = true;

  @Field(type => String)
  get outfitType() {
    console.log(this);
    return "";
  }
  set outfitType(a: any) {}
}
