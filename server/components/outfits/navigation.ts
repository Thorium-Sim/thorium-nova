import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class NavigationComponent extends Component {
  static id: "navigation" = "navigation";
  static defaults: ComponentOmit<NavigationComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
