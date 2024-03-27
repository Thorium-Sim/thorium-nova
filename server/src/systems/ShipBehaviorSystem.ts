import { randomPointInSphere } from "@thorium/randomPoint/randomPointInSphere";
import { type Entity, System, type ECS } from "../utils/ecs";
import { Vector3 } from "three";
import type { shipBehavior } from "@server/components/shipBehavior";
import { getOrbitPosition } from "@server/utils/getOrbitPosition";

const wanderVector = new Vector3();
const targetPoint = new Vector3();
const shipPosition = new Vector3();
const destinationVector = new Vector3();
export class ShipBehaviorSystem extends System {
	frequency = 10;
	test(entity: Entity) {
		return !!entity.components.shipBehavior;
	}

	update(entity: Entity, elapsed: number) {
		const { shipBehavior } = entity.components;
		if (!shipBehavior) return;
		const { objective, target, destination, patrolRadius } = shipBehavior;

		switch (objective) {
			case "wander": {
				// If the ship is within 1/10 of the patrol radius, pick a new destination
				const position = entity.components.position;
				if (!position) return;
				shipPosition.set(position.x, position.y, position.z);
				if (destination) {
					destinationVector.set(destination.x, destination.y, destination.z);
				}
				if (
					!destination ||
					shipPosition.distanceTo(destinationVector) < patrolRadius / 10
				) {
					getTargetPoint(this.ecs, target, targetPoint);
					// Pick a new destination
					const [x, y, z] = randomPointInSphere(patrolRadius);
					wanderVector.set(x, y, z).add(targetPoint);

					// Set the new destination
					entity.updateComponent("shipBehavior", {
						rotationAutopilot: true,
						forwardAutopilot: true,
						destination: {
							parentId: destination?.parentId || null,
							x: wanderVector.x,
							y: wanderVector.y,
							z: wanderVector.z,
						},
					});
				}

				break;
			}
			default:
				break;
		}
	}
}

function getTargetPoint(
	ecs: ECS,
	target: Zod.infer<typeof shipBehavior>["target"],
	targetPoint: Vector3,
): void {
	if (!target) return;
	if (typeof target === "object") {
		targetPoint.set(target.x, target.y, target.z);
		return;
	}
	const targetEntity = ecs.getEntityById(target);
	if (!targetEntity) return;

	if (targetEntity.components.position) {
		targetPoint.set(
			targetEntity.components.position.x,
			targetEntity.components.position.y,
			targetEntity.components.position.z,
		);
	}

	if (targetEntity.components.satellite) {
		const position = getOrbitPosition(targetEntity.components.satellite);
		targetPoint.set(position.x, position.y, position.z);
	}
}
