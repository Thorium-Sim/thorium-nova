import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class IsSystemComponent extends Component {
  static id: "isSystem" = "isSystem";
  static defaults: ComponentOmit<IsSystemComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
