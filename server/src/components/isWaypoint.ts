import {Component} from "./utils";

export class IsWaypointComponent extends Component {
  static id: "isWaypoint" = "isWaypoint";

  /** The ship that has the assigned waypoint */
  assignedShipId: number = -1;
  /** The object which the waypoint is associated with. */
  attachedObjectId?: number;
}
