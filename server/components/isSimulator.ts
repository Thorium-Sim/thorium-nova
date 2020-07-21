import {Field, ID, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsSimulatorComponent extends Component {
  static id: "isSimulator" = "isSimulator";
  static defaults: ComponentOmit<IsSimulatorComponent> = {
    value: true,
  };

  @Field()
  value: true = true;
}
