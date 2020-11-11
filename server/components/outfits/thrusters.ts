import {Field, ObjectType} from "type-graphql";
import {Coordinates} from "../Coordinates";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class ThrustersComponent extends Component {
  static id: "thrusters" = "thrusters";
  static defaults: ComponentOmit<ThrustersComponent> = {
    thrusting: false,
    direction: new Coordinates(),
    directionAcceleration: new Coordinates(),
    directionMaxSpeed: 1,
    directionThrust: 12500,

    rotationDelta: new Coordinates(),
    rotationVelocity: new Coordinates(),
    rotationMaxSpeed: 5,
    rotationThrust: 12500,
  };

  @Field()
  get thrusting(): boolean {
    return Boolean(
      this.direction.x ||
        this.direction.y ||
        this.direction.z ||
        this.rotationDelta.x ||
        this.rotationDelta.y ||
        this.rotationDelta.z
    );
  }
  set thrusting(_) {}

  @Field({description: "The currently applied direction thruster vector"})
  direction: Coordinates = new Coordinates();
  @Field({
    description: "The current direction thruster acceleration vector in m/s/s",
  })
  directionAcceleration: Coordinates = new Coordinates();
  @Field({
    description:
      "The maximum speed which can be applied by direction thrusters in m/s",
  })
  directionMaxSpeed: number = 1;
  @Field({
    description:
      "The thrust applied by direction thrusters in kilo-newtons, which affects how fast the ship accelerates based on the mass of the ship.",
  })
  directionThrust: number = 12500;

  @Field({description: "The current vector of rotation being applied."})
  rotationDelta: Coordinates = new Coordinates();
  @Field({description: "The current rotation velocity in radians per second."})
  rotationVelocity: Coordinates = new Coordinates();
  @Field({description: "The max rotation speed in rotations per minute."})
  rotationMaxSpeed: number = 5;
  @Field({
    description:
      "The thrust applied by rotation thrusters in kilo-newtons, which affects how fast the rotation accelerates based on the mass of the ship.",
  })
  rotationThrust: number = 12500;
}
