import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class ThemeComponent extends Component {
  static id: "theme" = "theme";
  static defaults: ComponentOmit<ThemeComponent> = {
    value: "default",
  };

  @Field(type => String)
  value: string = "default";
}
