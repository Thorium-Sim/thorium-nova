import { pubsub } from "@thorium/.server/init/pubsub";
import { spawnTorpedo } from "@thorium/.server/spawners/torpedo";
import { getSystemsOfType } from "@thorium/.server/systems/NPCDecisionSystem";
import {
	getPhaserCharge,
	getTargetIsInPhaserRange,
} from "@thorium/.server/systems/PhasersSystem";
import { playShipSound } from "@thorium/utils/.server/playRangedSound";
import { type Entity, System } from "@thorium/utils/ecs";
import { Quaternion, Vector3 } from "three";
import { radToDeg, degToRad } from "three/src/math/MathUtils.js";

const shipPosition = new Vector3();
const targetPosition = new Vector3();
const shipQuaternion = new Quaternion();
// TODO: Only fire torpedos when the direction of the torpedo launcher
// is roughly pointed towards the target

/** How many seconds the torpedo should travel before hitting the target */
export const TORPEDO_FIRE_DISTANCE_SECONDS = 10;

export class NPCFireWeaponsSystem extends System {
	static flightMode = ["nova"];
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
		const shipAction = entity.components.shipBehavior?.action;

		if (!["firePhasers", "fireTorpedo"].includes(shipAction!)) {
			return;
		}
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
		shipQuaternion.set(
			entity.components.rotation!.x,
			entity.components.rotation!.y,
			entity.components.rotation!.z,
			entity.components.rotation!.w,
		);
		targetPosition.set(
			target.components.position!.x,
			target.components.position!.y,
			target.components.position!.z,
		);

		const distance = shipPosition.distanceTo(targetPosition);

		if (distance > weaponsRange) return;

		if (shipAction === "firePhasers") {
			const phaserSystems = getSystemsOfType(this.ecs, entity.id, "Phasers");

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
		if (shipAction === "fireTorpedo") {
			const torpedoSystems = getSystemsOfType(
				this.ecs,
				entity.id,
				"TorpedoLauncher",
			);

			// Determine the speed of the loaded torpedo. Fire when the distance would take 10 seconds for the torpedo to hit.
			for (const launcher of torpedoSystems) {
				if (launcher.components.isTorpedoLauncher?.status !== "loaded")
					continue;
				const inventoryTemplate = this.ecs.getEntityById(
					launcher.components.isTorpedoLauncher?.torpedoEntity || -1,
				);
				const torp = inventoryTemplate?.components.isInventory;
				if (!torp) continue;

				// Check to see if the torpedo launcher is currently pointing at the target
				const { pitchDegree, headingDegree } =
					launcher.components.isTorpedoLauncher;

				const pointingAtTarget = isPointingAtTarget(
					shipPosition,
					targetPosition,
					shipQuaternion,
					headingDegree,
					pitchDegree,
				);
				if (!pointingAtTarget) continue;

				const torpedo = spawnTorpedo(launcher);
				this.ecs.addEntity(torpedo);

				// NPCs have a static torpedo reload time multiplier so they don't fire too often
				// Increase this number to fire less often
				const powerMultiplier = 10;

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

		entity.updateComponent("shipBehavior", { action: "regroup" });
	}
}

function isPointingAtTarget(
	shipPosition: Vector3,
	targetPosition: Vector3,
	shipRotation: Quaternion,
	torpedoLauncherHeadingDegrees: number,
	torpedoLauncherPitchDegrees: number,
	toleranceAngleDegrees = 45,
): boolean {
	// Convert angles from degrees to radians
	const headingRad = degToRad(torpedoLauncherHeadingDegrees);
	const pitchRad = degToRad(torpedoLauncherPitchDegrees);

	// Create the launcher direction in local ship coordinates
	// Assuming forward is +Z, right is +X, up is +Y in ship local space
	const localLauncherDirection = new Vector3(
		Math.sin(headingRad) * Math.cos(pitchRad), // X component (left/right)
		-Math.sin(pitchRad), // Y component (up/down, negative for pitch up)
		Math.cos(headingRad) * Math.cos(pitchRad), // Z component (forward/back)
	);

	// Transform the local launcher direction to world space using ship rotation
	const worldLauncherDirection = localLauncherDirection
		.clone()
		.applyQuaternion(shipRotation);

	// Calculate direction from ship to target
	const shipToTarget = new Vector3()
		.subVectors(targetPosition, shipPosition)
		.normalize();

	// Calculate the angle between launcher direction and target direction
	const dotProduct = worldLauncherDirection.dot(shipToTarget);
	const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct))); // Clamp to avoid floating point errors
	const angleDeg = radToDeg(angleRad);

	// Check if the angle is within tolerance
	return angleDeg <= toleranceAngleDegrees;
}
