import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class VelocityComponent extends Component {
  static id: "Velocity" = "Velocity";
  static defaults: ComponentOmit<VelocityComponent> = {
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
