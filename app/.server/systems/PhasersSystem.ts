import { pubsub } from "@thorium/.server/init/pubsub";
import { type ECS, type Entity, System } from "@thorium/utils/ecs";
import { cancelLoopingSound } from "@thorium/utils/.server/playRangedSound";
import { degToRad, megaWattHourToGigaJoule } from "@thorium/utils/unitTypes";
import { Quaternion, Vector3 } from "three";
import { applyDamage } from "@thorium/utils/.server/ship/collisionDamage";
import { isPointWithinCone } from "@thorium/utils/starmap/isPointWithinCone";

export class PhasersSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isPhasers;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedHours = elapsed / 1000 / 3600;
		const phasers = entity.components.isPhasers;
		if (!phasers) return;

		// Phaser damage is calculated based on the power output and efficiency
		//  of the phaser system
		const power = entity.components.power;
		if (!power) return;
		const efficiency = entity.components.damage?.efficiency ?? 1;
		if (phasers.firePercent === 0) return;
		const phaserShip = entity.ecs?.getEntityById(
			entity.components.isShipSystem?.shipId || -1,
		);
		if (power.currentPower === 0) {
			entity.updateComponent("isPhasers", { firePercent: 0 });
			// TODO: Pubsub anywhere that needs to know phasers aren't firing
			pubsub.publish.targeting.phasers.firing({
				systemId: phaserShip?.components.position?.parentId || null,
			});

			// Stop any phaser sounds
			cancelLoopingSound(entity, "fire");
		}
		const phaserDamage = power.currentPower * efficiency * elapsedHours;
		if (phaserDamage === 0) return;
		if (!phaserShip) return;
		const target = getCurrentTarget(phaserShip);

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
	const target = getCurrentTarget(ship);
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

export function getCurrentTarget(ship: Entity) {
	for (const [entityId] of ship.components.shipSystems?.shipSystems || []) {
		const entity = ship.ecs?.getEntityById(entityId);

		if (entity?.components.isTargeting) {
			return ship.ecs?.getEntityById(
				entity.components.isTargeting?.target || -1,
			);
		}
	}
}

/** Returns the average charge of all the phase capacitors connected this phaser system */
export function getPhaserCharge(e: Entity) {
	const phaseCapacitors = e.components.power?.powerSources.reduce(
		(prev, next) => {
			if (prev.has(next)) return prev;
			const entity = e.ecs?.getEntityById(next);
			if (!entity?.components.isPhaseCapacitor || !entity.components.isBattery)
				return prev;
			prev.set(next, {
				storage: entity.components.isBattery.storage,
				capacity: entity.components.isBattery.capacity,
			});
			return prev;
		},
		new Map<number, { storage: number; capacity: number }>(),
	);

	let chargePercent = 0;
	if (phaseCapacitors) {
		for (const capacitor of phaseCapacitors.values()) {
			chargePercent +=
				capacitor.storage / capacitor.capacity / phaseCapacitors.size;
		}
	}

	return chargePercent;
}
