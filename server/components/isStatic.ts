import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType({description: "Indicates an object that does not move."})
export class IsStaticComponent extends Component {
  static id: "isStatic" = "isStatic";
  static defaults: ComponentOmit<IsStaticComponent> = {
    value: null,
  };

  @Field(type => String, {nullable: true})
  value: null = null;
}
