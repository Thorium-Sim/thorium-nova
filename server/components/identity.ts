import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IdentityComponent extends Component {
  static id: "identity" = "identity";
  static defaults: ComponentOmit<IdentityComponent> = {
    name: "Entity",
  };

  @Field()
  name: string = "Entity";
}
