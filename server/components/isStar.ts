import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsStarComponent extends Component {
  static id: "isStar" = "isStar";
  static defaults: ComponentOmit<IsStarComponent> = {
    // Mass in comparison to Sol
    solarMass: 1,
    // Age in years
    age: 4000000000,
  };

  @Field()
  solarMass: number = 1;

  @Field()
  age: number = 4000000000;
}
