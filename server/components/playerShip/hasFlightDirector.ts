import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class HasFlightDirectorComponent extends Component {
  static id: "hasFlightDirector" = "hasFlightDirector";
  static defaults: ComponentOmit<HasFlightDirectorComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
