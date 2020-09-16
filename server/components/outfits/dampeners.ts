import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class DampenerComponent extends Component {
  static id: "dampener" = "dampener";
  static defaults: ComponentOmit<DampenerComponent> = {
    dampening: 10,
  };

  // This is applied based on the current velocity of the ship to slowly bring it
  // to a stop or back in line with it's current course.
  @Field({
    description:
      "The acceleration of dampening on the movement of the ship, excluding thruster movement.",
  })
  dampening: number = 10;
}
