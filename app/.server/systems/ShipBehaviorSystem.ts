import { type Entity, System, type ECS } from "@thorium/utils/ecs";
import { Vector3 } from "three";
import type { shipBehavior } from "@thorium/ecs-components/shipBehavior";
import { randomPointInSphere } from "@thorium/utils/operations/randomPointInSphere";
import { pathfinder } from "@thorium/utils/starmap/pathfinder.server";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";

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
		const { objective, behaviorTarget, actionTarget, patrolRadius } =
			shipBehavior;

		switch (objective) {
			case "patrol": {
				// If the ship is within 1/10 of the patrol radius, pick a new destination
				const position = entity.components.position;
				if (!position) return;
				shipPosition.set(position.x, position.y, position.z);
				if (typeof actionTarget === "object" && actionTarget) {
					destinationVector.set(actionTarget.x, actionTarget.y, actionTarget.z);
				}
				if (
					!actionTarget ||
					typeof actionTarget === "number" ||
					shipPosition.distanceTo(destinationVector) < patrolRadius / 10
				) {
					const targetPoint = getTargetPoint(this.ecs, behaviorTarget);
					// Pick a new destination
					const [x, y, z] = randomPointInSphere(patrolRadius);
					wanderVector.set(x, y, z).add(targetPoint);

					// Set the new destination
					entity.updateComponent("shipBehavior", {
						actionTarget: {
							parentId: position?.parentId || null,
							x: wanderVector.x,
							y: wanderVector.y,
							z: wanderVector.z,
						},
					});

					let path: { x: number; y: number; z: number }[] = [];
					if (
						typeof actionTarget === "object" &&
						position.parentId === actionTarget?.parentId &&
						position.parentId
					) {
						path = pathfinder(entity, wanderVector) || [];
					}
					const nextCoordinates = path.shift();
					entity.updateComponent("autopilot", {
						rotationAutopilot: true,
						forwardAutopilot: true,
						desiredCoordinates: {
							x: wanderVector.x,
							y: wanderVector.y,
							z: wanderVector.z,
						},
						path,
						nextCoordinates,
						desiredSolarSystemId: position?.parentId || null,
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
	target: Zod.infer<typeof shipBehavior>["behaviorTarget"],
) {
	if (!target) return targetPoint;
	if (typeof target === "object") {
		targetPoint.set(target.x, target.y, target.z);
		return targetPoint;
	}
	const targetEntity = ecs.getEntityById(target);
	if (!targetEntity) return targetPoint;

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

	return targetPoint;
}
