import type { Entity } from "./ecs";

export function handleCollisionDamage(
	entity: Entity | null,
	force: number,
	elapsed: number,
) {
	if (!entity) return;
	const m = entity?.components.mass?.mass || 1;
	if (!m) return;

	// Formula: KE = 0.5 * m * v^2
	// But I've condensed it a bit.
	const kineticEnergyInJoules = (elapsed ** 2 * force ** 2) / (2 * m);
	// Convert the kinetic energy to gigajoules
	applyDamage(entity, kineticEnergyInJoules / 1e9);
}

export function handleTorpedoDamage(torpedo: Entity, other: Entity) {
	const torpedoYield = torpedo.components.isTorpedo?.yield || 0;
	// Yield is already in gigajoules
	const damage = torpedoYield;

	// TODO May 11, 2024: Apply other damage based on the damage type of the torpedo
	applyDamage(other, damage);

	// Stop the torpedo from moving any further
	torpedo.updateComponent("isTorpedo", { targetId: null });
	torpedo.updateComponent("velocity", { x: 0, y: 0, z: 0 });
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
}

export function applyDamage(entity: Entity, damageInGigajoules: number) {
	// TODO May 11, 2024: Apply damage to the shields first

	// Apply damage to the hull
	if (entity.components.hull) {
		entity.updateComponent("hull", {
			hull: entity.components.hull.hull - damageInGigajoules,
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
