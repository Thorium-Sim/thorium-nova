import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";
import { Vector2 } from "three";

const positionVec = new Vector2();
const destinationVec = new Vector2();
const directionVec = new Vector2();
export class LegacySensorContactMovementSystem extends System {
	static flightMode = ["legacy"];
	destroyedCounter = new Map<number, number>();
	frequency = 2;
	test(entity: Entity) {
		return !!entity.components.isSensorContact;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
		const { isSensorContact, position, isArmyContact } = entity.components;
		if (!isSensorContact || !position || isArmyContact) return;
		const sensorsSys = this.ecs.getEntityById(isSensorContact.sensorsId);

		const sensors = sensorsSys?.components.isLegacySensors;
		if (!sensors) return;

		let destinationUpdate = false;
		if ((sensors.movement.x || sensors.movement.y) && !isSensorContact.locked) {
			// Apply the movement vector to the contact's position and destination
			position.x += sensors.movement.x / 100;
			position.y += sensors.movement.y / 100;
			isSensorContact.destination.x += sensors.movement.x / 100;
			isSensorContact.destination.y += sensors.movement.y / 100;
			destinationUpdate = true;
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
				x: position.x + directionVec.x,
				y: position.y + directionVec.y,
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
					pubsub.publish.legacy.sensorGrid.sensorContacts({
						shipId: isSensorContact.shipId,
					});
					destinationUpdate = true;
					this.destroyedCounter.delete(entity.id);
				} else {
					this.destroyedCounter.set(entity.id, timer + elapsed);
				}
			}
		}
		if (destinationUpdate) {
			pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
				shipId: isSensorContact.shipId,
			});
		}
	}
}
