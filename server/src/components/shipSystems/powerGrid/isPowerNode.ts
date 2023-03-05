import {Component} from "../../utils";

export class IsPowerNodeComponent extends Component {
  static id = "isPowerNode" as const;

  /**
   * The systems that are associated with this power node
   */
  connectedSystems: number[] = [];

  /**
   * The number of incoming connections which this power node supports
   */
  maxConnections: number = 3;

  /**
   * How the power is distributed through the connected systems:
   * - Evenly (fill up systems evenly until the system is full)
   * - Least Need First (first fill up the systems with the smallest power requirement)
   * - Most Need First (first fill up the systems with the largest power requirement)
   */
  distributionMode: "evenly" | "leastFirst" | "mostFirst" = "evenly";
}
