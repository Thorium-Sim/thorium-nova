import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class HeatComponent extends Component {
  static id: "heat" = "heat";
  static defaults: ComponentOmit<HeatComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
