import {type Entity, System} from "../utils/ecs";

export class PassengerDestinationSystem extends System {
  test(entity: Entity) {
    return !!entity.components.passengerMovement;
  }
  frequency = 10;
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;
  }
}
