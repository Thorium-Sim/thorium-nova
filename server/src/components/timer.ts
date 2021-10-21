import {Component} from "./utils";

export class TimerComponent extends Component {
  static id: "timer" = "timer";

  label: string = "Generic";

  time: string = "00:05:00";

  paused: boolean = false;
}
