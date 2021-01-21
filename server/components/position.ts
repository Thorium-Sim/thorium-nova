import {Field, InputType, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
@InputType("PositionInput")
export class PositionComponent extends Component {
  // Note: When used with Planetary System components, position represents lightyears; otherwise it represents kilometers
  static id: "position" = "position";
  static defaults: ComponentOmit<PositionComponent> = {
    x: 0,
    y: 0,
    z: 0,
  };

  @Field()
  x: number = 0;

  @Field()
  y: number = 0;

  @Field()
  z: number = 0;
}
