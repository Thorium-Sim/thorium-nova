import {Component, ComponentOmit} from "./utils";

export class TimerComponent extends Component {
  static id: "timer" = "timer";
  static defaults: ComponentOmit<TimerComponent> = {
    label: "Generic",
    time: "00:05:00",
    paused: false,
  };

  label!: string;

  time!: string;

  paused!: boolean;
}
