import type { Entity } from "@server/utils/ecs";
import { Quaternion, Vector3 } from "three";

const vector = new Vector3();
const quaternion = new Quaternion();
const zAxis = new Vector3(0, 0, 1);

export function dataStreamEntity(e: Entity) {
	// For snapshot interpolation, entities have to be flat, other than quaternions.
	// See https://github.com/geckosio/snapshot-interpolation#world-state
	// We're also removing any components of the entity that don't update
	// frequently to keep packet size down.

	if (e.components.isReactor) {
		return {
			id: e.id.toString(),
			x: e.components.isReactor.currentOutput,
			z: e.components.heat?.heat || 0,
		};
	}
	if (e.components.isBattery) {
		return {
			id: e.id.toString(),
			x: e.components.isBattery.storage,
			y: e.components.isBattery.chargeAmount,
			z: e.components.isBattery.outputAmount,
		};
	}
	if (e.components.isImpulseEngines) {
		const { targetSpeed } = e.components.isImpulseEngines;

		return {
			id: e.id.toString(),
			x: targetSpeed,
			y: e.components.power?.currentPower,
			z: e.components.heat?.heat || 0,
		};
	}
	if (e.components.isWarpEngines) {
		const { maxVelocity } = e.components.isWarpEngines;
		return {
			id: e.id.toString(),
			x: maxVelocity,
			y: e.components.power?.currentPower,
			z: e.components.heat?.heat || 0,
		};
	}
	if (e.components.isShields) {
		return {
			id: e.id.toString(),
			x: e.components.isShields.strength,
			y: e.components.power?.currentPower,
			z: e.components.heat?.heat || 0,
		};
	}
	if (e.components.isPhasers) {
		// We'll count the storage of any attached phase capacitor
		const phaseCapacitors = e.components.power?.powerSources.reduce(
			(prev, next) => {
				if (prev.has(next)) return prev;
				const entity = e.ecs?.getEntityById(next);
				if (
					!entity?.components.isPhaseCapacitor ||
					!entity.components.isBattery
				)
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

		return {
			id: e.id.toString(),
			x: chargePercent,
			y: e.components.power?.currentPower,
			z: e.components.heat?.heat || 0,
		};
	}
	if (e.components.power) {
		return {
			id: e.id.toString(),
			y: e.components.power.currentPower,
			z: e.components.heat?.heat || 0,
		};
	}
	if (e.components.isTorpedo) {
		const { parentId, type, ...position } = e.components.position || {};
		const { x, y, z } = e.components.velocity || { x: 0, y: 0, z: 0 };
		const shouldSnap = e.components.snapInterpolation ? 1 : 0;
		e.removeComponent("snapInterpolation");
		quaternion.setFromUnitVectors(zAxis, vector.set(x, y, z).normalize());
		return {
			id: e.id.toString(),
			...position,
			f: e.components.isDestroyed ? 1 : 0,
			s: shouldSnap,
			r: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
		};
	}

	const { parentId, type, ...position } = e.components.position || {};
	const shouldSnap = e.components.snapInterpolation ? 1 : 0;
	e.removeComponent("snapInterpolation");
	return {
		id: e.id.toString(),
		...position,
		f: e.components.velocity?.forwardVelocity || 0,
		s: shouldSnap,
		r: e.components.rotation,
	};
}
