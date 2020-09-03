import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class ThrustersComponent extends Component {
  static id: "thrusters" = "thrusters";
  static defaults: ComponentOmit<ThrustersComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
