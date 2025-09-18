import { pubsub } from "@thorium/.server/init/pubsub";
import { rotatePoint } from "@thorium/cards/Legacy/SensorGrid/data.server";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { type Entity, System } from "@thorium/utils/ecs";
import { Vector2 } from "three";

const positionVec = new Vector2();
const destinationVec = new Vector2();
const directionVec = new Vector2();
export class LegacySensorContactMovementSystem extends System {
	static flightMode = ["legacy"];
	destroyedCounter = new Map<number, number>();
	frequency = 2;
	destinationUpdates = new Set<number>();
	sensorsUpdates = new Set<number>();
	test(entity: Entity) {
		return !!entity.components.isSensorContact;
	}
	preUpdate(_elapsed: number): void {
		this.destinationUpdates.clear();
		this.sensorsUpdates.clear();
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
		const { isSensorContact, position, isArmyContact } = entity.components;
		if (!isSensorContact || !position || isArmyContact) return;
		const sensorsSys = this.ecs.getEntityById(isSensorContact.sensorsId);

		const sensors = sensorsSys?.components.isLegacySensors;
		if (!sensors) return;
		const maxDistance =
			isSensorContact.type === "planet"
				? (entity.components.size?.length || 1) / 2
				: 0.03;
		const {
			x: movementX,
			y: movementY,
			thrustersSystem,
		} = getSensorGridMovement(sensorsSys);

		// Rotate contact based on the thruster yaw
		const elapsedMinutes = elapsedRatio / 60;
		if (!isSensorContact.locked && thrustersSystem?.components.isThrusters) {
			const yawDiff =
				-1 *
				thrustersSystem.components.isThrusters.rotationDelta.y *
				(thrustersSystem.components.isThrusters.rotationMaxSpeed * 360) *
				elapsedMinutes;
			if (yawDiff !== 0) {
				const newPosition = rotatePoint(position, yawDiff);
				position.x = newPosition.x;
				position.y = newPosition.y;

				const newDestination = rotatePoint(
					isSensorContact.destination,
					yawDiff,
				);
				entity.updateComponent("isSensorContact", {
					destination: newDestination,
				});
				this.destinationUpdates.add(isSensorContact.shipId);
			}
		}

		if ((movementX || movementY) && !isSensorContact.locked) {
			// Apply the movement vector to the contact's position and destination

			position.x += movementX;
			position.y += movementY;
			if (entity.components.isProgramContact) {
				// Delete program contacts when the reach the edge of sensors
				if (
					isSensorContact.destination.x + movementX > 1 + maxDistance ||
					isSensorContact.destination.x + movementX < -1 * maxDistance ||
					isSensorContact.destination.y + movementY > 1 + maxDistance ||
					isSensorContact.destination.y + movementY < -1 * maxDistance
				) {
					this.ecs.removeEntity(entity);
					this.sensorsUpdates.add(isSensorContact.shipId);

					return;
				}
			}
			entity.updateComponent("isSensorContact", {
				destination: {
					x: Math.max(
						-1 * maxDistance,
						Math.min(
							1 + maxDistance,
							isSensorContact.destination.x + movementX,
						),
					),
					y: Math.max(
						-1 * maxDistance,
						Math.min(
							1 + maxDistance,
							isSensorContact.destination.y + movementY,
						),
					),
				},
			});
			this.destinationUpdates.add(isSensorContact.shipId);
		}

		positionVec.set(position.x, position.y);
		destinationVec.set(
			isSensorContact.destination.x,
			isSensorContact.destination.y,
		);
		const distance = destinationVec.distanceToSquared(positionVec);
		if (
			isSensorContact.speed > 500 ||
			distance / isSensorContact.speed <= 0.001
		) {
			entity.updateComponent("position", {
				x: isSensorContact.destination.x,
				y: isSensorContact.destination.y,
			});
			if (isSensorContact.speed > 500) {
				entity.addComponent("snapInterpolation");
			}
		} else {
			directionVec
				.subVectors(destinationVec, positionVec)
				.normalize()
				.multiplyScalar(isSensorContact.speed * elapsedRatio);

			entity.updateComponent("position", {
				x: Math.max(
					-1 * maxDistance,
					Math.min(1 + maxDistance, position.x + directionVec.x),
				),
				y: Math.max(
					-1 * maxDistance,
					Math.min(1 + maxDistance, position.y + directionVec.y),
				),
			});
		}

		// Clear out any sensor contacts that have been destroyed
		if (isSensorContact.destroyed || isSensorContact.type === "ping") {
			const timerLimit = isSensorContact.destroyed
				? 1000
				: isSensorContact.type === "ping"
					? 3000
					: 1000;
			if (!this.destroyedCounter.has(entity.id)) {
				this.destroyedCounter.set(entity.id, 0);
			} else {
				const timer = this.destroyedCounter.get(entity.id) || 0;
				if (timer > timerLimit) {
					this.ecs.removeEntity(entity);
					this.sensorsUpdates.add(isSensorContact.shipId);
					this.destinationUpdates.add(isSensorContact.shipId);
					this.destroyedCounter.delete(entity.id);
				} else {
					this.destroyedCounter.set(entity.id, timer + elapsed);
				}
			}
		}
	}
	postUpdate(_elapsed: number): void {
		for (const shipId of this.destinationUpdates) {
			pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
				shipId,
			});
		}
		for (const shipId of this.sensorsUpdates) {
			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId,
			});
		}
	}
}

export function getSensorGridMovement(sensors: Entity) {
	if (!sensors.components.isLegacySensors) return { x: 0, y: 0 };
	let movementX = sensors.components.isLegacySensors.movement.x / 100;
	let movementY = sensors.components.isLegacySensors.movement.y / 100;

	const thrustersSystem = getShipSystem(sensors.ecs, {
		systemType: "thrusters",
		shipId: sensors.components.isShipSystem?.shipId || -1,
	});
	if (sensors.components.isLegacySensors.autoThrusters) {
		if (thrustersSystem?.components.isThrusters) {
			const maxSpeed = thrustersSystem.components.isThrusters.directionMaxSpeed;
			movementX +=
				(thrustersSystem.components.isThrusters.direction.x * maxSpeed) / 1000;
			movementY +=
				(thrustersSystem.components.isThrusters.direction.z * maxSpeed) / 1000;
		}
	}
	return { x: movementX, y: movementY, thrustersSystem };
}
