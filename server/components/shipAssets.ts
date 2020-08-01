import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class ShipAssetsComponent extends Component {
  static id: "shipAssets" = "shipAssets";
  static getDefaults(): ComponentOmit<ShipAssetsComponent> {
    return {
      model: "",
      side: "",
      top: "",
      logo: "",
      vanity: "",
    };
  }

  @Field()
  model: string = "";

  // The side, top, and vanity views are automatically
  // generated from the ship model before the
  // model is uploaded.
  @Field()
  side: string = "";
  @Field()
  top: string = "";
  @Field()
  vanity: string = "";
  @Field()
  logo: string = "";
}
