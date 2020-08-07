import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsPlanetComponent extends Component {
  static id: "isPlanet" = "isPlanet";
  static defaults: ComponentOmit<IsPlanetComponent> = {
    // Age in years
    age: 4543000000,
    // Star Trek planetary classification https://memory-alpha.fandom.com/wiki/Planetary_classification
    class: "M",
  };
  @Field()
  age: number = 4000000000;

  @Field()
  class: string = "M";
}
