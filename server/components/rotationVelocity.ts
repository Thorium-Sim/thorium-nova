import {Field, InputType, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class RotationVelocityComponent extends Component {
  static id: "rotationVelocity" = "rotationVelocity";
  static defaults: ComponentOmit<RotationVelocityComponent> = {
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
