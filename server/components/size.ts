import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class SizeComponent extends Component {
  static id: "size" = "size";
  static defaults: ComponentOmit<SizeComponent> = {
    // Size in kilometers long
    // This roughly equates to scale.
    value: 1,
  };

  @Field()
  value: number = 1;
}
