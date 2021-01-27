import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class NavigationComponent extends Component {
  static id: "navigation" = "navigation";
  static defaults: ComponentOmit<NavigationComponent> = {
    destinationWaypointId: null,
    destination: null,
    locked: false,
    maxDestinationRadius: 0,
  };

  destinationWaypointId: string | null = null;
  @Field(type => Entity, {
    description: "The desired destination waypoint.",
    nullable: true,
  })
  get destination(): Entity | null {
    if (!this.destinationWaypointId) return null;
    return (
      App.activeFlight?.ecs.entities.find(
        e => e.id === this.destinationWaypointId
      ) || null
    );
  }
  set destination(a: Entity | null) {}
  @Field({description: "Whether the course has been locked in."})
  locked: boolean = false;
  @Field({
    description: "The maximum radius to which destinations can be set in ly.",
  })
  maxDestinationRadius: number = 2000;
}
/**
 * Setting course has the following steps:
 * 1. Open up the starmap and find the destination you want to go to
 * 2. Reticles appear on the viewscreen for the Pilot to line
 *    up with.
 * 3. The pilot lines up the course using Thrusters, and clicks
 *    the "Lock In" button. If the current trajectory is within
 *    a certain threshold, the thruster system is locked and the
 *    ship is now on course.
 * 4. The destination entity is stored; the destination position
 *    is looked up by reference.
 */
