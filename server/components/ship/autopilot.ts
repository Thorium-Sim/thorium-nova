import Controller from "node-pid-controller";
import {Field, ObjectType} from "type-graphql";
import {Coordinates} from "../Coordinates";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class AutopilotComponent extends Component {
  static id: "autopilot" = "autopilot";
  static defaults: ComponentOmit<AutopilotComponent> = {};

  @Field(type => Coordinates, {
    description: "The desired coordinates of the ship in the current stage.",
  })
  desiredCoordinates?: Coordinates;
  excludeFields?: (keyof AutopilotComponent)[] = [
    "yawController",
    "pitchController",
    "rollController",
    "excludeFields",
  ];

  yawController?: Controller;
  pitchController?: Controller;
  rollController?: Controller;
}
