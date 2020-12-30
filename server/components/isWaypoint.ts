import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsWaypointComponent extends Component {
  static id: "isWaypoint" = "isWaypoint";
  static defaults: ComponentOmit<IsWaypointComponent> = {
    assignedShipId: "",
    attachedObjectId: "",
  };

  @Field({description: "The ship that has the assigned waypoint"})
  assignedShipId: string = "";
  @Field({description: "The object which the waypoint is associated with."})
  attachedObjectId?: string;
}
