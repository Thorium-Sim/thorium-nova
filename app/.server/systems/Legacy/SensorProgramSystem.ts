import { pubsub } from "@thorium/.server/init/pubsub";
import { getSensorGridMovement } from "@thorium/.server/systems/Legacy/SensorContactMovementSystem";
import {
	createContact,
	getArmyContacts,
} from "@thorium/cards/Legacy/SensorGrid/createContact.server";
import { type Entity, System } from "@thorium/utils/ecs";
import { Vector2 } from "three";

const forwardVec = new Vector2(0, 1);
const movementVec = new Vector2();

export class LegacySensorProgramSystem extends System {
	static flightMode = ["legacy"];
	test(entity: Entity) {
		return !!entity.components.isLegacySensors;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;
		const { isLegacySensors } = entity.components;
		if (!isLegacySensors?.program) return;

		const { x: movementX, y: movementY } = getSensorGridMovement(entity);
		movementVec.set(movementX, movementY);
		if (movementVec.length() === 0) return;

		const rad = movementVec.angleTo(forwardVec) * (movementX > 0 ? -1 : 1);

		if (isLegacySensors.program.type === "field") {
			if (
				this.ecs.rng.next() + 0.5 <
				isLegacySensors.program.density *
					(movementVec.length() * 10000) *
					elapsedRatio
			) {
				const armyContact = this.ecs.rng.nextFromList(
					getArmyContacts(
						this.ecs,
						entity.components.isShipSystem?.shipId || -1,
					).filter((c) => !c.components.isArmyContact?.omitFromProgram),
				);
				if (!armyContact) return;

				const contact = createContact(
					entity.components.isShipSystem?.shipId || -1,
					entity.id,
					armyContact,
				);
				movementVec.set(this.ecs.rng.next() + 0.5, -0.01);
				movementVec.rotateAround({ x: 0.5, y: 0.5 }, rad);
				contact.updateComponent("position", {
					x: movementVec.x,
					y: movementVec.y,
				});
				contact.updateComponent("isSensorContact", {
					destination: { x: movementVec.x, y: movementVec.y },
				});
				contact.addComponent("isProgramContact");
				this.ecs.addEntity(contact);
				pubsub.publish.legacy.sensorGrid.sensorContacts({
					shipId: entity.components.isShipSystem?.shipId || -1,
				});
				pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
					shipId: entity.components.isShipSystem?.shipId || -1,
				});
			}
		}
	}
}
