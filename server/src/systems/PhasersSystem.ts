import { pubsub } from "@server/init/pubsub";
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
		const efficiency = entity.components.efficiency?.efficiency ?? 1;
		if (phasers.firePercent === 0) return;
		if (power.currentPower === 0) {
			entity.updateComponent("isPhasers", { firePercent: 0 });
			const phaserShip = entity.ecs?.getEntityById(
				entity.components.isShipSystem?.shipId || -1,
			);
			// TODO: Pubsub anywhere that needs to know phasers aren't firing
			pubsub.publish.targeting.phasers.firing({
				shipId: phaserShip?.id || -1,
				systemId: phaserShip?.components.position?.parentId || null,
			});
		}
		const phaserDamage = power.currentPower * efficiency * elapsedHours;
		if (phaserDamage === 0) return;

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
	if (!phasers.components.isPhasers) return false;
	const ship = phasers.ecs?.getEntityById(
		phasers.components.isShipSystem?.shipId || -1,
	);
	if (!ship) return false;
	const target = getCurrentTarget(ship.id, phasers.ecs!);
	if (!target) return false;

	const { maxRange, arc, maxArc, headingDegree, pitchDegree } =
		phasers.components.isPhasers;
	const range = maxRange - maxRange * (arc / (maxArc + 1));

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
	direction.applyAxisAngle(new Vector3(0, 1, 0), degToRad(headingDegree || 0));
	direction.applyAxisAngle(new Vector3(1, 0, 0), degToRad(pitchDegree || 0));
	direction.multiplyScalar(range);
	return isPointWithinCone(targetPosition, {
		apex: shipPosition,
		direction,
		angle: degToRad(phasers.components.isPhasers?.arc || 0),
	});
}

export function getCurrentTarget(shipId: number, ecs: ECS) {
	for (const entity of ecs?.componentCache.get("isTargeting") || []) {
		if (entity.components.isShipSystem?.shipId === shipId) {
			return ecs?.getEntityById(entity.components.isTargeting?.target || -1);
		}
	}
}
