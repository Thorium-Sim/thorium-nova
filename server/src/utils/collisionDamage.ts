import { pubsub } from "@server/init/pubsub";
import type { Entity } from "./ecs";
import { Vector3 } from "three";
import {
	gigaJouleToMegaWattHour,
	megaWattHourToGigaJoule,
} from "@server/utils/unitTypes";
import {
	getWhichShield,
	ShieldDirections,
} from "@server/classes/Plugins/ShipSystems/Shields";
import { getShipSystems } from "@server/utils/getShipSystem";

export function handleCollisionDamage(
	entity: Entity | null,
	force: number,
	direction: Vector3,
	elapsed: number,
) {
	if (!entity) return;
	const m = entity?.components.mass?.mass || 1;
	if (!m) return;

	// Formula: KE = 0.5 * m * v^2
	// But I've condensed it a bit.
	const kineticEnergyInJoules = (elapsed ** 2 * force ** 2) / (2 * m);
	// Convert the kinetic energy to gigajoules
	applyDamage(entity, kineticEnergyInJoules / 1e9, direction);
}

export function handleTorpedoDamage(
	torpedo: Entity,
	other: Entity,
	direction: Vector3,
) {
	const torpedoYield = torpedo.components.isTorpedo?.yield || 0;
	// Yield is in megawatt hours, convert to gigajoules
	const damage = megaWattHourToGigaJoule(torpedoYield);

	// TODO May 11, 2024: Apply other damage based on the damage type of the torpedo
	applyDamage(other, damage, direction);

	const vector3 = new Vector3();
	const otherVector = new Vector3();
	vector3.set(
		torpedo.components.position?.x || 0,
		torpedo.components.position?.y || 0,
		torpedo.components.position?.z || 0,
	);
	otherVector.set(
		other.components.position?.x || 0,
		other.components.position?.y || 0,
		other.components.position?.z || 0,
	);
	// Stop the torpedo from moving any further
	torpedo.updateComponent("isTorpedo", { targetId: null });
	torpedo.updateComponent("velocity", { x: 0, y: 0, z: 0 });
	if (other.components.position) {
		torpedo.updateComponent("position", {
			x: other.components.position.x,
			y: other.components.position.y,
			z: other.components.position.z,
		});
		torpedo.addComponent("snapInterpolation", {});
	}
	const explosion =
		torpedoYield > 6
			? "large"
			: torpedoYield > 3
			  ? "medium"
			  : torpedoYield > 0
				  ? "small"
				  : "none";
	torpedo.addComponent("isDestroyed", {
		timeToDestroy: explosion !== "none" ? 5000 : 0,
		explosion,
	});

	pubsub.publish.starmapCore.torpedos({
		systemId: torpedo.components.position?.parentId || null,
	});
}

export function applyDamage(
	entity: Entity,
	damageInGigajoules: number,
	// The vector from the ship to the impact point.
	direction: Vector3,
) {
	// TODO May 11, 2024: Apply damage to the shields first
	const size = entity.components.size || { length: 1, width: 1, height: 1 };
	const shieldDirection = getWhichShield(direction, {
		x: size.width,
		y: size.height,
		z: size.length,
	});
	let shieldSystem: Entity | null = null;
	for (const systemId of entity.components.shipSystems?.shipSystems.keys() ||
		[]) {
		const system = entity.ecs?.getEntityById(systemId);
		if (system?.components.isShields?.direction === shieldDirection) {
			shieldSystem = system;
			break;
		}
	}
	let remainingDamage = 0;
	if (shieldSystem?.components.isShields) {
		// TODO August 22, 2024: Have the shield frequency affect the damage
		const { strength, maxStrength, deflectionEfficiencyMultiplier } =
			shieldSystem.components.isShields;
		let shieldStrength = strength - gigaJouleToMegaWattHour(damageInGigajoules);
		if (shieldStrength < 0) {
			remainingDamage = -megaWattHourToGigaJoule(shieldStrength);
			shieldStrength = 0;
		}
		shieldSystem.updateComponent("isShields", {
			strength: shieldStrength,
		});

		const efficiencyHit =
			(1 - shieldStrength / maxStrength) * deflectionEfficiencyMultiplier;
		if (shieldSystem.components.efficiency) {
			shieldSystem.updateComponent("efficiency", {
				efficiency: Math.max(
					0,
					shieldSystem.components.efficiency.efficiency - efficiencyHit,
				),
			});
		}
	} else {
		remainingDamage = damageInGigajoules;
	}
	// Apply damage to the hull
	if (remainingDamage > 0 && entity.components.hull) {
		entity.updateComponent("hull", {
			hull: entity.components.hull.hull - remainingDamage,
		});

		if (entity.components.hull.hull <= 0) {
			const mass = entity.components.mass?.mass || 1;
			const explosion =
				mass > 1_000_000_000
					? "large"
					: mass > 100_000_000
					  ? "medium"
					  : "small";

			entity.addComponent("isDestroyed", {
				timeToDestroy: 5000,
				explosion,
			});
		}
	}
}
