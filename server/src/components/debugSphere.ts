import {Component} from "./utils";

/**
 * A component that is used to debug the behavior system
 * by showing where the ship is trying to go.
 */
export class DebugSphereComponent extends Component {
  static id = "debugSphere" as const;

  entityId: number = -1;
}
