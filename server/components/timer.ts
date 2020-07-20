import {Field, ID, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class TimerComponent extends Component {
  static id: "timer" = "timer";
  static defaults: ComponentOmit<TimerComponent> = {
    label: "Generic",
    time: "00:05:00",
    paused: false,
  };

  @Field()
  label!: string;

  @Field()
  time: string = "00:00:00";

  @Field()
  paused: boolean = false;
}
