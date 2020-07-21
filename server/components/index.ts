import {Field, ObjectType} from "type-graphql";
import {TimerComponent} from "./timer";
import {IsSimulatorComponent} from "./isSimulator";

@ObjectType()
export default class Components {
  @Field()
  timer?: TimerComponent;
  @Field()
  isSimulator?: IsSimulatorComponent;
}
