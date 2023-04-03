import {Component} from "./utils";

export class EfficiencyComponent extends Component {
  static id = "efficiency" as const;

  efficiency: number = 1;

  /**
   * A multiplier to determine how much the efficiency will drop
   * as power in the system overloads. If currentPower x2 the
   * maxSafePower (100%) and the multiplier is set to 1, then
   * efficiency will drop by 100% over the course of 1 second.
   *
   * By default, this is set to 0.1, which allows systems to
   * overload by x2 for 10 seconds.
   */
  multiplier: number = 0.015;

  /**
   * Systems should slowly, randomly lose efficiency to entropy.
   * This multiplier defines how much will decrease every frame.
   */
  entropyMultiplier: number = 0.00005;
}
