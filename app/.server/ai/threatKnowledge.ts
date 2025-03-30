import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import type { Entity } from "@thorium/utils/ecs";
import { isFriendOrFoe } from "@thorium/utils/starmap/isFriendOrFoe";
import { Vector3 } from "three";

const velocity1 = new Vector3();
const velocity2 = new Vector3();
/**
 * Evaluates the threat level of each nearby ship
 *
 * Depends on
 * - The faction of the ship
 * - Current objective
 * - Current target for the objective
 * - Scan results about weapons, targeting, and shields
 * - Distance from the object
 * - The relative velocity of the ship
 **/
export function threatKnowledge(ship: Entity) {
	const threats = new Map<number, number>();
	const { position, velocity, npcKnowledge } = ship.components;
	if (!position) return;
	const activeRange = npcKnowledge?.activeRange || 100000;
	// {[id]:distance}
	const nearbyObjects = ship.components.nearbyObjects?.objects as Map<
		number,
		number
	>;
	const reputation = ship.components.reputation?.reputation || {};
	const faction =
		ship.ecs?.getEntityById(ship.components.faction?.factionId || -1)
			?.components.reputation?.reputation || {};
	for (const [objectId, distance] of nearbyObjects) {
		const object = ship.ecs?.getEntityById(Number(objectId));
		if (!object?.components.position || !object.components.isShip) continue;
		// If the current objective is to attack the target, override this logic
		if (
			ship.components.shipBehavior?.objective === "attack" &&
			ship.components.shipBehavior.behaviorTarget === Number(objectId)
		) {
			threats.set(Number(objectId), 1);
		}

		// Start with the distance
		const distanceScore =
			(Math.max(0, activeRange - distance) / activeRange) * 0.1;

		// Relative velocity - Moving towards the ship = bigger threat
		let velocityScore = 0;
		if (velocity && object.components.velocity) {
			velocityScore =
				velocity1
					.set(velocity.x, velocity.y, velocity.z)
					.sub(
						velocity2.set(
							object.components.velocity.x,
							object.components.velocity.y,
							object.components.velocity.z,
						),
					)
					.normalize()
					.length() * 0.1;
		}

		// Targeting value - bigger threat if targeting
		// - ship
		// - ship's escort
		// - ships that are friendly to the ship
		const sensors = getShipSystem(ship.ecs!, {
			systemType: "sensors",
			shipId: ship.id,
		});
		const objectScanResults = sensors.components.isSensors?.resultsDatabase.get(
			object.id,
		);

		const targetId = objectScanResults?.targeting?.targetId;
		let targetingScore = 0;
		if (targetId === ship.id) {
			targetingScore = 1;
		} else if (
			targetId === ship.components.shipBehavior?.behaviorTarget &&
			ship.components.shipBehavior?.objective === "defend"
		) {
			targetingScore = 1;
		} else if (targetId) {
			const targetEntity = ship.ecs?.getEntityById(targetId);
			const targetFactionValue = isFriendOrFoe(
				reputation,
				faction,
				targetId,
				targetEntity?.components.faction?.factionId || -1,
			);
			if (targetFactionValue > 1) {
				targetingScore = targetFactionValue / 1000;
			}
		}

		// Shields - bigger threat if shields are raised
		const shieldsScore = objectScanResults?.shields?.status === "up" ? 0.1 : 0;

		// Weapons - bigger threat if weapons are ready
		const weaponsScore =
			objectScanResults?.weapons?.weapons.reduce((prev, next, i, arr) => {
				if (next.type === "phasers") {
					prev += next.charge / arr.length;
				}
				if (next.type === "torpedoes") {
					prev += (next.loaded === "Unloaded" ? 0 : 0.5) / arr.length;
				}
				return prev;
			}, 0) || 0;

		const factionValue = isFriendOrFoe(
			reputation,
			faction,
			Number(objectId),
			object.components.faction?.factionId || -1,
		);

		const factionMultiplier = 1 - factionValue / 1000;

		const threatScore =
			(distanceScore +
				velocityScore +
				targetingScore +
				shieldsScore +
				weaponsScore) *
			factionMultiplier;

		threats.set(object.id, threatScore);
	}

	return threats;
}
