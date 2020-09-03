import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class PowerComponent extends Component {
  static id: "power" = "power";
  static defaults: ComponentOmit<PowerComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
