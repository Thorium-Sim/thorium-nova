import { applyDamage } from "@server/utils/collisionDamage";
import { type ECS, type Entity, System } from "@server/utils/ecs";
import { isPointWithinCone } from "@server/utils/isPointWithinCone";
import { degToRad, megaWattHourToGigaJoule } from "@server/utils/unitTypes";
import { Quaternion, Vector3 } from "three";

export class PhasersSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isPhasers;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedHours = elapsed / (1000 / this.frequency) / 3600;
		const phasers = entity.components.isPhasers;
		if (!phasers) return;

		// Phaser damage is calculated based on the power output and efficiency
		//  of the phaser system
		const power = entity.components.power;
		if (!power) return;
		const efficiency = entity.components.efficiency?.efficiency || 1;

		const powerOutput = power.currentPower * efficiency * elapsedHours;
		const phaserDamage = powerOutput * phasers.yieldMultiplier;

		const target = getCurrentTarget(
			entity.components.isShipSystem?.shipId || -1,
			entity.ecs!,
		);

		if (!target) return;
		// Calculate the vector between the target and the ship
		const vectorBetween = getVectorBetweenTargetAndShip(entity, target);
		applyDamage(target, megaWattHourToGigaJoule(phaserDamage), vectorBetween);
	}
}

const targetPosition = new Vector3();
const shipPosition = new Vector3();
const direction = new Vector3();
const rotationQuaternion = new Quaternion();

function getVectorBetweenTargetAndShip(ship: Entity, target: Entity) {
	targetPosition.set(
		target.components.position?.x || 0,
		target.components.position?.y || 0,
		target.components.position?.z || 0,
	);
	shipPosition.set(
		ship.components.position?.x || 0,
		ship.components.position?.y || 0,
		ship.components.position?.z || 0,
	);

	return targetPosition.sub(shipPosition).normalize();
}
export function getTargetIsInPhaserRange(phasers: Entity) {
	const ship = phasers.ecs?.getEntityById(
		phasers.components.isShipSystem?.shipId || -1,
	);
	if (!ship) return false;

	const target = getCurrentTarget(
		ship.components.isShipSystem?.shipId || -1,
		phasers.ecs!,
	);

	if (!target) return false;
	targetPosition.set(
		target.components.position?.x || 0,
		target.components.position?.y || 0,
		target.components.position?.z || 0,
	);
	shipPosition.set(
		ship.components.position?.x || 0,
		ship.components.position?.y || 0,
		ship.components.position?.z || 0,
	);
	rotationQuaternion.set(
		ship.components.rotation?.x || 0,
		ship.components.rotation?.y || 0,
		ship.components.rotation?.z || 0,
		ship.components.rotation?.w || 1,
	);
	// Turn the ship rotation quaternion into a vector
	direction.set(0, 0, 1).applyQuaternion(rotationQuaternion);
	// Add the Phaser rotation to the ship rotation
	direction.applyAxisAngle(
		new Vector3(0, 1, 0),
		degToRad(phasers.components.isPhasers?.headingDegree || 0),
	);
	direction.applyAxisAngle(
		new Vector3(1, 0, 0),
		degToRad(phasers.components.isPhasers?.pitchDegree || 0),
	);

	return isPointWithinCone(targetPosition, {
		apex: shipPosition,
		direction,
		angle: degToRad(phasers.components.isPhasers?.arc || 0),
	});
}

function getCurrentTarget(shipId: number, ecs: ECS) {
	for (const entity of ecs?.componentCache.get("isTargeting") || []) {
		if (entity.components.isShipSystem?.shipId === shipId) {
			return ecs?.getEntityById(entity.components.isTargeting?.target || -1);
		}
	}
}
