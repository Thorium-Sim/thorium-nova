import {Field, ObjectType} from "type-graphql";
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
    description: "The force in kilo-newtons which impulse engines apply.",
  })
  thrust: number = 1;

  @Field({description: "The desired speed of the ship in km/s."})
  targetSpeed: number = 0;

  @Field({description: "The forward acceleration of the ship in km/s^2."})
  forwardAcceleration: number = 0;
}
