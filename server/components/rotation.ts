import {Field, InputType, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class RotationComponent extends Component {
  static id: "rotation" = "rotation";
  static defaults: ComponentOmit<RotationComponent> = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };

  @Field()
  x: number = 0;

  @Field()
  y: number = 0;

  @Field()
  z: number = 0;

  @Field()
  w: number = 1;
}
