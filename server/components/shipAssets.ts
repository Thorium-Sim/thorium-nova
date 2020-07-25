import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class ShipAssetsComponent extends Component {
  static id: "shipAssets" = "shipAssets";
  static defaults: ComponentOmit<ShipAssetsComponent> = {
    model: "",
    side: "",
    top: "",
    logo: "",
  };

  @Field()
  model: string = "";

  // The side and top view are automatically
  // generated from the ship model when the
  // model is uploaded.
  @Field()
  side: string = "";
  @Field()
  top: string = "";
  @Field()
  logo: string = "";
}
