import { pubsub } from "@thorium/.server/init/pubsub";
import { spawnTorpedo } from "@thorium/.server/spawners/torpedo";
import { getSystemsOfType } from "@thorium/.server/systems/NPCDecisionSystem";
import {
	getPhaserCharge,
	getTargetIsInPhaserRange,
} from "@thorium/.server/systems/PhasersSystem";
import { playShipSound } from "@thorium/utils/.server/playRangedSound";
import { type Entity, System } from "@thorium/utils/ecs";
import { Vector3 } from "three";

const shipPosition = new Vector3();
const targetPosition = new Vector3();

/** How many seconds the torpedo should travel before hitting the target */
const TORPEDO_FIRE_DISTANCE_SECONDS = 10;

export class NPCFireWeaponsSystem extends System {
	test(entity: Entity) {
		return !!(
			entity.components.isShip && !entity.components.isPlayerShip?.value
		);
	}
	update(entity: Entity, _elapsedMs: number): void {
		const targetingSystem = getSystemsOfType(
			this.ecs,
			entity.id,
			"Targeting",
		)[0];

		const target = this.ecs.getEntityById(
			targetingSystem?.components.isTargeting?.target || -1,
		);

		if (!target) return;

		const weaponsRange = entity.components.npcKnowledge?.weaponsRange || 25_000;

		shipPosition.set(
			entity.components.position!.x,
			entity.components.position!.y,
			entity.components.position!.z,
		);
		targetPosition.set(
			target.components.position!.x,
			target.components.position!.y,
			target.components.position!.z,
		);

		const distance = shipPosition.distanceTo(targetPosition);

		if (distance > weaponsRange) return;

		const torpedoSystems = getSystemsOfType(
			this.ecs,
			entity.id,
			"TorpedoLauncher",
		);
		const phaserSystems = getSystemsOfType(this.ecs, entity.id, "Phasers");

		// Determine the speed of the loaded torpedo. Fire when the distance would take 10 seconds for the torpedo to hit.
		for (const launcher of torpedoSystems) {
			if (launcher.components.isTorpedoLauncher?.status !== "loaded") continue;
			const inventoryTemplate = this.ecs.getEntityById(
				launcher.components.isTorpedoLauncher?.torpedoEntity || -1,
			);
			if (!inventoryTemplate) continue;

			const speed =
				inventoryTemplate.components.isInventory?.flags.torpedoCasing?.speed ||
				0;

			const torpedoTravelDistance = speed * TORPEDO_FIRE_DISTANCE_SECONDS;

			if (distance >= torpedoTravelDistance) {
				const torpedo = spawnTorpedo(launcher);
				this.ecs.addEntity(torpedo);

				// NPCs have a static torpedo reload time
				const powerMultiplier = 2;

				launcher.updateComponent("isTorpedoLauncher", {
					status: "firing",
					progress:
						launcher.components.isTorpedoLauncher.fireTime * powerMultiplier,
				});
				pubsub.publish.starmapCore.torpedos({
					systemId: torpedo.components.position?.parentId || null,
				});
				if (entity) {
					pubsub.publish.targeting.torpedoes.launchers({
						shipId: entity.id,
					});

					playShipSound(launcher, entity, "fire", weaponsRange);
				}
			}
		}

		const systemId = entity.components.position?.parentId || null;
		let phasersChanged = false;
		// Determine whether the ship is close enough and angled correctly for phasers
		for (const phaserSystem of phaserSystems) {
			if (!phaserSystem.components.isPhasers) continue;
			// We can adjust the phaser system's arc based on the distance to the target.
			const { maxRange, arc, maxArc, headingDegree, pitchDegree } =
				phaserSystem.components.isPhasers;
			const idealRange = distance * 1.1;
			const idealArc = Math.max(
				0,
				Math.min(maxArc, ((maxRange - idealRange) * (maxArc + 1)) / maxRange),
			);
			if (arc !== idealArc) {
				phaserSystem.updateComponent("isPhasers", { arc: idealArc });
				pubsub.publish.targeting.phasers.list({
					shipId: phaserSystem.components.isShipSystem?.shipId || -1,
				});
			}
			const currentCharge = getPhaserCharge(phaserSystem);
			const inRange = getTargetIsInPhaserRange(phaserSystem);
			if (
				phaserSystem.components.isPhasers.firePercent === 0 &&
				inRange &&
				currentCharge > 0.1
			) {
				phaserSystem.updateComponent("isPhasers", { firePercent: 1 });
				phasersChanged = true;
			}
			if (
				phaserSystem.components.isPhasers.firePercent === 1 &&
				(!inRange || currentCharge < 0.1)
			) {
				phaserSystem.updateComponent("isPhasers", { firePercent: 0 });
				phasersChanged = true;
			}
		}

		// TODO May 17 2025 - Make sure sound effects get played
		if (phasersChanged) {
			pubsub.publish.targeting.phasers.firing({ systemId });
		}
	}
}
