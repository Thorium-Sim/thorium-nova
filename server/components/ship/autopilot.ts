import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class IsOnAutopilot extends Component {
  static id: "isOnAutopilot" = "isOnAutopilot";
  static defaults: ComponentOmit<IsOnAutopilot> = {
    value: true,
  };

  @Field()
  value: true = true;
}
