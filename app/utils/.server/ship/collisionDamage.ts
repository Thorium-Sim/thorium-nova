import { pubsub } from "@thorium/.server/init/pubsub";
import type { Entity } from "@thorium/utils/ecs";
import { Vector3 } from "three";
import {
	gigaJouleToMegaWattHour,
	megaWattHourToGigaJoule,
} from "@thorium/utils/unitTypes";
import { getWhichShield } from "@thorium/.server/classes/Plugins/ShipSystems/Shields";
import {
	damageEffects,
	getDamageMetricMultipliers,
	type damageTypes as damageType,
} from "@thorium/utils/flags/damageTypes";
import type z from "zod";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";

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
	applyDamage(entity, kineticEnergyInJoules / 1e9, direction, [
		"Structural",
		"Fatigue",
	]);
}

export function handleTorpedoDamage(
	torpedo: Entity,
	other: Entity,
	direction: Vector3,
) {
	const torpedoYield = torpedo.components.isTorpedo?.yield || 0;
	// Yield is in megawatt hours, convert to gigajoules
	const damage = megaWattHourToGigaJoule(torpedoYield);

	applyDamage(other, damage, direction, [
		torpedo.components.isTorpedo?.damageType || "Structural",
	]);

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
		destroyedTimestamp: Date.now(),
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
	damageTypes?: z.infer<typeof damageType>[],
	ignoreShields?: boolean,
) {
	let remainingDamage = damageInGigajoules;
	let systemDamage = damageInGigajoules;
	if (!ignoreShields) {
		const afterShields = applyShieldDamage(
			entity,
			damageInGigajoules,
			direction,
		);
		remainingDamage = afterShields.remainingDamage;
		systemDamage = afterShields.systemDamage;
	}
	// Apply system damage
	const damagableSystems = [
		...(entity.components.shipSystems?.shipSystems.keys() || []),
	].flatMap((id) => {
		const sys = entity.ecs.getEntityById(id);
		if (
			sys?.components.damage &&
			sys.components.damage.vulnerability !== "invulnerable"
		)
			return sys;
		return [];
	});
	const vulnerableSystems = damagableSystems.filter(
		(d) => d.components.damage?.vulnerability === "vulnerable",
	);

	// Split the system damage semi-randomly between a handful of systems.
	const damageSplit: number[] = [];

	while (damageSplit.length < damagableSystems.length) {
		const totalDamage = damageSplit.reduce((p, n) => p + n, 0);
		// This ensures we will be spreading damage between at least three systems
		const nextDamage = (entity.ecs.rng.next() + 0.5) * 0.5;

		if (totalDamage + nextDamage >= 1) {
			damageSplit.push(1 - totalDamage);
			break;
		}

		damageSplit.push(nextDamage);
	}
	for (const damage of damageSplit) {
		// Target vulnerable systems first
		let system: Entity | undefined;

		if (vulnerableSystems.length > 0) {
			system = entity.ecs.rng.nextFromList(vulnerableSystems);
			vulnerableSystems.splice(vulnerableSystems.indexOf(system), 1);
		}

		if (!system) {
			system = entity.ecs.rng.nextFromList(damagableSystems);
		}
		if (!system) break;
		applySystemDamage(system, systemDamage * damage, damageTypes);
	}

	// Apply damage to the hull
	if (remainingDamage > 0 && entity.components.hull) {
		entity.updateComponent("hull", {
			hull: entity.components.hull.hull - remainingDamage,
		});
		pubsub.publish.targeting.hull({ shipId: entity.id });
		if (entity.components.hull.hull <= 0) {
			destroyShip(entity);
		}
	}
}

export function destroyShip(entity: Entity) {
	const mass = entity.components.mass?.mass || 1;
	const explosion =
		mass > 1_000_000_000 ? "large" : mass > 100_000_000 ? "medium" : "small";

	const flightEntity = entity.ecs.componentCache
		.get("isFlight")
		?.values()
		.next().value;

	entity.addComponent("isDestroyed", {
		destroyedTimestamp: Date.now(),
		timeToDestroy: entity.components.isPlayerShip
			? flightEntity?.components.isFlight?.respawnTimeMs
			: 5000,
		explosion,
	});

	// Stop the engines
	const impulse = getShipSystem(entity.ecs, {
		systemType: "impulseEngines",
		shipId: entity.id,
	});
	impulse?.updateComponent("isImpulseEngines", { targetSpeed: 0 });
	const warp = getShipSystem(entity.ecs, {
		systemType: "warpEngines",
		shipId: entity.id,
	});
	warp?.updateComponent("isWarpEngines", { currentWarpFactor: 0 });
	const thrusters = getShipSystem(entity.ecs, {
		systemType: "thrusters",
		shipId: entity.id,
	});
	thrusters?.updateComponent("isThrusters", {
		direction: { x: 0, y: 0, z: 0 },
		rotationDelta: { x: 0, y: 0, z: 0 },
	});

	entity.updateComponent("autopilot", {
		destinationWaypointId: null,
		desiredCoordinates: undefined,
		desiredRotation: null,
		desiredSolarSystemId: undefined,
		path: [],
		nextCoordinates: null,
		rotationAutopilot: false,
		forwardAutopilot: false,
	});
	pubsub.publish.pilot.impulseEngines.get({
		shipId: entity.id,
		systemId: impulse.id,
	});
	pubsub.publish.pilot.warpEngines.get({
		shipId: entity.id,
		systemId: warp.id,
	});
	pubsub.publish.pilot.autopilot.get({ shipId: entity.id });

	const systemId = entity.components.position?.parentId || null;

	pubsub.publish.starmapCore.autopilot({
		systemId,
	});
	if (entity.components.isPlayerShip) {
		pubsub.publish.ship.player({ shipId: entity.id });
	}
	if (entity.components.isTorpedo) {
		pubsub.publish.starmapCore.torpedos({
			systemId,
		});
	}
	pubsub.publish.starmapCore.ships({
		systemId,
	});
}
export function applySystemDamage(
	system: Entity,
	damage: number,
	damageTypes?: z.infer<typeof damageType>[],
) {
	const damageMetricMultipliers = getDamageMetricMultipliers(system);

	const damageMultiplier =
		damageTypes?.reduce((prev, next, i, arr) => {
			return (
				prev +
				(system?.components.damage?.damageTypeMultipliers[next] || 1) /
					arr.length
			);
		}, 1) || 1;

	const appliedDamage = damage * damageMultiplier;
	// Do the same thing, but for the damage metrics. Efficiency is always one of them, though.
	const effectSplit: number[] = [];
	while (effectSplit.length < damageEffects.length) {
		const totalDamage = effectSplit.reduce((p, n) => p + n, 0);
		const nextDamage = system.ecs.rng.next() + 0.5;

		if (totalDamage + nextDamage >= 1) {
			effectSplit.push(1 - totalDamage);
			break;
		}
		effectSplit.push(nextDamage);
	}
	effectSplit.sort((a, b) => b - a);

	const damageAppliedToSystem: Record<string, number> = {};
	for (let i = 0; i < effectSplit.length; i++) {
		const effect = system.ecs.rng.nextFromList(damageEffects);
		const damageAppliedToEffect =
			appliedDamage *
			effectSplit[i] *
			(effect === "efficiency" ? -1 : 1) *
			damageMetricMultipliers[effect];
		if (!damageAppliedToSystem[effect]) {
			damageAppliedToSystem[effect] = system.components.damage?.[effect] || 0;
		}
		damageAppliedToSystem[effect] += damageAppliedToEffect;
	}
	system.updateComponent("damage", damageAppliedToSystem);
}

function applyShieldDamage(
	entity: Entity,
	damageInGigajoules: number,
	// The vector from the ship to the impact point.
	direction: Vector3,
	damageTypes?: z.infer<typeof damageType>[],
) {
	const size = /*entity.components.size ||*/ { length: 1, width: 1, height: 1 };
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
	let systemDamageMultiplier = 0;
	// Average the damage multipliers if there are multiple damage types
	const damageMultiplier =
		damageTypes?.reduce((prev, next, i, arr) => {
			return (
				prev +
				(shieldSystem?.components.damage?.damageTypeMultipliers[next] || 1) /
					arr.length
			);
		}, 1) || 1;

	if (shieldSystem?.components.isShields) {
		// TODO August 22, 2024: Have the shield frequency affect the damage
		const { strength, maxStrength, deflectionEfficiencyMultiplier } =
			shieldSystem.components.isShields;
		let shieldStrength =
			strength - gigaJouleToMegaWattHour(damageInGigajoules) * damageMultiplier;

		if (shieldStrength < 0) {
			remainingDamage =
				-megaWattHourToGigaJoule(shieldStrength) * damageMultiplier;
			shieldStrength = 0;
		}
		shieldSystem.updateComponent("isShields", {
			strength: shieldStrength,
		});

		systemDamageMultiplier =
			(1 - shieldStrength / maxStrength) * deflectionEfficiencyMultiplier;
	} else {
		remainingDamage = damageInGigajoules;
		systemDamageMultiplier = 1;
	}

	return {
		remainingDamage,
		systemDamage: damageInGigajoules * systemDamageMultiplier,
	};
}
