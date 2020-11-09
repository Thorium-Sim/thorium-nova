import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";
import Json from "graphql-type-json";

@ObjectType()
export class IsFactionComponent extends Component {
  static id: "isFaction" = "isFaction";
  static getDefaults(): ComponentOmit<IsFactionComponent> {
    return {
      logo: "",
      color: "#0088ff",
      attitude: {},
    };
  }

  @Field()
  logo: string = "";
  @Field()
  color: string = "#0088ff";
  @Field(type => Json)
  attitude: {[factionId: string]: number} = {};
}
