import Controller from "node-pid-controller";
import {Field, ID, ObjectType} from "type-graphql";
import {Coordinates} from "../Coordinates";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class AutopilotComponent extends Component {
  static id: "autopilot" = "autopilot";
  static defaults: ComponentOmit<AutopilotComponent> = {
    rotationAutopilot: true,
    forwardAutopilot: true,
  };

  @Field(type => Coordinates, {
    description:
      "The desired coordinates of the ship in the current stage. If desiredInterstellarSystemId is null, then it's interstellar coordinates",
    nullable: true,
  })
  desiredCoordinates?: Coordinates;

  @Field(type => ID, {
    description:
      "Desired interstellar system. For when we are traveling from one system to another.",
    nullable: true,
  })
  desiredInterstellarSystemId?: string | null;

  @Field(type => Boolean, {
    description: "Whether the rotation autopilot is on.",
  })
  rotationAutopilot: boolean = true;

  @Field(type => Boolean, {
    description: "Whether the forward movement autopilot is on.",
  })
  forwardAutopilot: boolean = true;

  static excludeFields?: (keyof AutopilotComponent)[] = [
    "yawController",
    "pitchController",
    "rollController",
    "speedController",
  ];

  yawController?: Controller;
  pitchController?: Controller;
  rollController?: Controller;
  speedController?: Controller;
}
