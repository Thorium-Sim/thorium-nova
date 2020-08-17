import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class PopulationComponent extends Component {
  static id: "population" = "population";
  static defaults: ComponentOmit<PopulationComponent> = {
    count: 0,
  };

  @Field()
  count: number = 0;
}
