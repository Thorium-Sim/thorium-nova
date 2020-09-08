import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class TrainingModeComponent extends Component {
  static id: "trainingMode" = "trainingMode";
  static defaults: ComponentOmit<TrainingModeComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
