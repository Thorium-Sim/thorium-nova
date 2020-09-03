import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class JumpDriveComponent extends Component {
  static id: "jumpDrive" = "jumpDrive";
  static defaults: ComponentOmit<JumpDriveComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
