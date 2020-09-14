import {Field, ObjectType} from "type-graphql";
import {Coordinates} from "../Coordinates";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class ImpulseEnginesComponent extends Component {
  static id: "impulseEngines" = "impulseEngines";
  static defaults: ComponentOmit<ImpulseEnginesComponent> = {
    cruisingSpeed: 1500,
    emergencySpeed: 2000,
    thrust: 1,
    targetSpeed: 0,
    forwardAcceleration: 0,
  };

  @Field({description: "The max speed at full impulse in km/s."})
  cruisingSpeed: number = 1500;
  @Field({description: "The max speed at emergency impulse in km/s."})
  emergencySpeed: number = 2000;
  @Field({
    description:
      "The force in kilo-newtons which impulse engines apply. If this is the same as the mass of the ship, it will take about 5 seconds to accelerate to cruising speed.",
  })
  thrust: number = 1;

  @Field({description: "The desired speed of the ship in km/s."})
  targetSpeed: number = 0;

  // When Impulse Engines are online and powered, they'll actively
  // try to keep the ship's velocity as close to the target velocity
  // as possible. That means automatically slowing the ship to a stop
  // or restoring the velocity if the ship is hit by the impact of
  // a weapon.
  // In universe, this is because of the inertial dampeners which cause
  // the ship to not have any inertia, which in turn eliminates issues around
  // fuel usage and the time it takes to accelerate.
  @Field({description: "The forward acceleration of the ship in km/s."})
  forwardAcceleration: number = 0;
}

/* A potential formula for calculating acceleration and velocity
let s = 300;
let v = 0;
let force = 4960000000;
let mass =  4960000000;

let seconds = 0;
const delta = 1 / 60;
while (s > v) {
  let a = (force / mass) * d;
  // Make acceleration a bit more quadratic
  a = a * v + a;
  v = v + a;
  seconds += delta;
}
// About 5 seconds to go from 0 to 300 km/s when force and mass are the same
*/
