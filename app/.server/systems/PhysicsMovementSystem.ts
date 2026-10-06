import {
	getBodyForEntity,
	getEntityWorld,
	universeToWorld,
	worldToUniverse,
} from "@thorium/.server/init/rapier";
import {
	handleCollisionDamage,
	handleTorpedoDamage,
} from "@thorium/utils/.server/ship/collisionDamage";
import { computeDockedTransform } from "@thorium/utils/dockingClient";
import { type Entity, System } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { KM_TO_LM, M_TO_KM, rpmToRadianPerSecond } from "@thorium/utils/unitTypes";
import { Euler, Object3D, Quaternion, Vector3 } from "three";

import { getWorldPosition, RAPIER } from "../init/rapier";

const tempObj = new Object3D();
const tempVector = new Vector3();
const worldVector = new Vector3();
const velocityVector = new Vector3();
const rotationVelocityVector = new Vector3();
const velocityEuler = new Euler();
const velocityQuaternion = new Quaternion();
const BRAKE_CONSTANT = 0.99;
const eventQueue = new RAPIER.EventQueue(true);

const frameAVec = new Vector3(0, 0, 1);
const frameBVec = new Vector3(0, 0, 1);

/**
 * This system applies the physics of anything flying through space
 * So ships, asteroids, projectiles, etc.
 *
 * There are two physics systems in the game:
 * 1. RapierJS - This is the main physics system. It's used for
 *   everything that's in the same physics world as the player.
 * 2. Simple - This is a simple physics system that doesn't include
 *  collisions. It's used for everything that's not in the same
 *  physics world as the player.
 */
export class PhysicsMovementSystem extends System {
	static flightMode = ["nova"];
	collisionStepEntities = new Set<number>();
	simpleJointEntities = new Set<number>();
	test(entity: Entity) {
		return Boolean(
			(entity.components.position && entity.components.velocity) ||
			(entity.components.rotation && entity.components.rotationVelocity),
		);
	}
	preUpdate(): void {
		this.collisionStepEntities.clear();
		this.simpleJointEntities.clear();
	}
	update(entity: Entity, elapsed: number) {
		if (this.ecs.colliderCache.size === 0) return;

		// Determine whether the entity is using collision or simple physics
		// and update the position accordingly.
		const world = getEntityWorld(entity);
		const position = entity.components.position;
		if (!position) return;

		// Nab some systems to use elsewhere.
		const systems: Entity[] = [];
		entity.components.shipSystems?.shipSystems.forEach((_, id) => {
			const sys = this.ecs.getEntityById(id);
			if (sys) systems.push(sys);
		});

		const inertialDampener = systems.find((sys) => sys.components.isInertialDampeners);
		const dampening = inertialDampener?.components.isInertialDampeners?.dampening || 0;
		const impulseEngines = systems.find((sys) => sys.components.isImpulseEngines);
		const forwardImpulse = impulseEngines?.components.isImpulseEngines?.forwardImpulse || 0;
		const thrusters = systems.find((sys) => sys.components.isThrusters);
		// We don't do collision when traveling at high warp speed
		// Let's say half of solar cruising speed
		const warpEngines = systems.find((sys) => sys.components.isWarpEngines);
		const isHighSpeed =
			(warpEngines?.components.isWarpEngines?.forwardVelocity || 0) >
			(warpEngines?.components.isWarpEngines?.solarCruisingSpeed || 0) / 2;
		const isInterstellarSpace = entity.components.position?.type === "interstellar";

		if (entity.components.rotation) {
			const { x, y, z, w } = entity.components.rotation;
			tempObj.quaternion.set(x, y, z, w);
		}
		if (world) {
			const worldPosition = getWorldPosition(position);
			worldVector.copy(worldPosition);
			const body = getBodyForEntity(entity, world);

			if (body && !isHighSpeed) {
				/**
				 * Collision Physics
				 */
				this.collisionStepEntities.add(entity.id);

				// No need to do further calculations if this entity is docked, since its body is attached to the parent entity
				// and will be dragged around with the joint during the world update phase
				if (entity.components.isDocked) return;

				// No need to do an update if this ship is docked with another ship
				// Transform the position of the body based on the position of the entity relative
				// to the position of the physics world entity.
				if (entity.components.position) {
					let positionVector = tempVector.set(
						entity.components.position.x,
						entity.components.position.y,
						entity.components.position.z,
					);
					positionVector = universeToWorld(positionVector, worldVector);
					body.setTranslation(positionVector, true);
				}
				if (entity.components.rotation) {
					body.setRotation(entity.components.rotation, true);
				}
				if (entity.components.velocity) {
					body.setLinvel(entity.components.velocity, true);
				}
				if (entity.components.rotationVelocity) {
					body.setAngvel(entity.components.rotationVelocity, true);
				}

				/**
				 * Inertial Dampeners
				 */
				body.setAngularDamping(dampening);
				body.setLinearDamping(dampening);

				/**
				 * Warp Engines
				 * They're weird, because they ignore mass. So we really
				 * should just set the velocity directly.
				 */
				if (warpEngines?.components.isWarpEngines) {
					const warpVelocity = tempObj.localToWorld(
						tempVector.set(0, 0, warpEngines.components.isWarpEngines.forwardVelocity),
					);
					if (warpVelocity.lengthSq() > 0) {
						body.setLinvel(
							{
								x: warpVelocity.x,
								y: warpVelocity.y,
								z: warpVelocity.z,
							},
							true,
						);
					}
				}

				/**
				 * Impulse Engines
				 */
				if (forwardImpulse) {
					body.applyImpulse(
						// I don't know why, but for some reason the impulse needs to be doubled
						// to reach the expected speed.
						tempObj.localToWorld(tempVector.set(0, 0, forwardImpulse * 2)),
						true,
					);
				}

				/**
				 * Thrusters
				 */
				if (thrusters?.components.isThrusters) {
					{
						const { x, y, z } = thrusters.components.isThrusters.directionImpulse;
						tempVector.set(x, y, z);
						body.applyImpulse(tempObj.localToWorld(tempVector), true);
					}

					// Set the max rotation velocity
					const { x, y, z } = body.angvel();
					tempVector.set(x, y, z);
					// Convert rotation max speed from RPM to radians per second
					if (
						tempVector.lengthSq() >
						rpmToRadianPerSecond(thrusters.components.isThrusters.rotationMaxSpeed)
					) {
						tempVector.multiplyScalar(BRAKE_CONSTANT);
						const { x, y, z } = tempVector;
						body.setAngvel({ x, y, z }, true);
					} else {
						const { x, y, z } = thrusters.components.isThrusters.rotationImpulse;

						tempVector.set(x, y, z);
						body.applyTorqueImpulse(tempObj.localToWorld(tempVector), true);
					}
				}
				return;
			}
			// Fall back on simple physics if we can't get a physics body for the entity.
		}

		{
			/**
			 * Simple Physics
			 */
			// If this ship is docked, just match it to the docked entity's position
			if (entity.components.isDocked) {
				this.simpleJointEntities.add(entity.id);
			}
			const elapsedRatio = elapsed / 1000;
			const mass = entity.components.mass?.mass || 1;
			{
				const { x, y, z } = entity.components.velocity || { x: 0, y: 0, z: 0 };
				velocityVector.set(x, y, z);
			}
			{
				const { x, y, z } = entity.components.rotationVelocity || {
					x: 0,
					y: 0,
					z: 0,
				};
				rotationVelocityVector.set(x, y, z);
			}
			/**
			 * Inertial Dampeners
			 */
			velocityVector.multiplyScalar(1 / (1 + elapsedRatio * dampening));
			rotationVelocityVector.multiplyScalar(1 / (1 + elapsedRatio * dampening));

			/**
			 * Warp Engines
			 * They ignore mass, so we set the velocity directly.
			 */
			if (warpEngines?.components.isWarpEngines?.forwardVelocity) {
				velocityVector.copy(
					tempObj.localToWorld(
						tempVector.set(0, 0, warpEngines.components.isWarpEngines.forwardVelocity),
					),
				);
			}
			/**
			 * Impulse Engines
			 */
			velocityVector.add(
				tempObj.localToWorld(
					tempVector.set(0, 0, forwardImpulse).divideScalar(mass).multiplyScalar(elapsedRatio),
				),
			);
			/**
			 * Thrusters
			 */
			if (thrusters?.components.isThrusters) {
				{
					const { x, y, z } = thrusters.components.isThrusters.directionImpulse;
					tempVector.set(x, y, z).multiplyScalar(elapsedRatio * M_TO_KM);
					velocityVector.add(tempObj.localToWorld(tempVector));
				}

				// Set the max rotation velocity
				if (rotationVelocityVector.lengthSq() > thrusters.components.isThrusters.rotationMaxSpeed) {
					rotationVelocityVector.multiplyScalar(BRAKE_CONSTANT);
				} else {
					const { x, y, z } = thrusters.components.isThrusters.rotationImpulse;

					tempVector.set(x, y, z);

					rotationVelocityVector.add(tempVector.divideScalar(mass).multiplyScalar(elapsedRatio));
				}
			}
			/**
			 * Compute forward velocity (km/s) before unit conversion
			 */
			const forwardVelocity = velocityVector.length();
			/**
			 * Translate velocity to LightMinutes if we're in interstellar space
			 */
			if (isInterstellarSpace) {
				velocityVector.multiplyScalar(KM_TO_LM);
			}
			/**
			 * Apply the velocity to the position
			 */
			{
				entity.updateComponent("velocity", {
					x: velocityVector.x,
					y: velocityVector.y,
					z: velocityVector.z,
					forwardVelocity,
				});
				const { x, y, z } = entity.components.position || { x: 0, y: 0, z: 0 };
				tempVector.set(x, y, z);
				tempVector.add(velocityVector.multiplyScalar(elapsedRatio));
				entity.updateComponent("position", {
					x: tempVector.x,
					y: tempVector.y,
					z: tempVector.z,
				});
			}
			/**
			 * Apply the rotation velocity to the rotation
			 */
			entity.updateComponent("rotationVelocity", {
				x: rotationVelocityVector.x,
				y: rotationVelocityVector.y,
				z: rotationVelocityVector.z,
			});
			velocityEuler.setFromVector3(rotationVelocityVector);
			velocityQuaternion.setFromEuler(velocityEuler);
			tempObj.quaternion.multiply(velocityQuaternion);
			entity.updateComponent("rotation", {
				x: tempObj.quaternion.x,
				y: tempObj.quaternion.y,
				z: tempObj.quaternion.z,
				w: tempObj.quaternion.w,
			});
		}
	}
	postUpdate(elapsed: number): void {
		const elapsedSeconds = elapsed / 1000;
		// Run the physics simulation for all of the relevant worlds.
		this.ecs.worlds.forEach((world) => {
			try {
				world.step(eventQueue);
			} catch (e) {
				// Occasionally there's an odd error that throws
				// We can mostly safely ignore it
				console.error("Rapier Step panicked", e);
			}

			eventQueue.drainContactForceEvents((event) => {
				const body1 = world.getCollider(event.collider1()).parent();
				const body2 = world.getCollider(event.collider2()).parent();
				const entityId1 = (body1?.userData as any)?.entityId;
				const entityId2 = (body2?.userData as any)?.entityId;
				const entity1 = this.ecs.getEntityById(entityId1);
				const entity2 = this.ecs.getEntityById(entityId2);

				// Special handling to ignore torpedoes their own ships
				if (entity1?.components.isTorpedo || entity2?.components.isTorpedo) {
					const entity = entity1?.components.isTorpedo ? entity1 : entity2;
					const otherEntity = entity1?.components.isTorpedo ? entity2 : entity1;
					const launcher = this.ecs.getEntityById(entity?.components.isTorpedo?.launcherId || -1);
					const ship = this.ecs.getEntityById(launcher?.components.isShipSystem?.shipId || -1);
					if (ship?.id !== undefined && ship.id === otherEntity?.id) {
						event.free();
						return;
					}
				}
				// This is the vector from entity1 to entity2,
				const direction = new Vector3(
					body1?.translation().x,
					body1?.translation().y,
					body1?.translation().z,
				)
					.sub(new Vector3(body2?.translation().x, body2?.translation().y, body2?.translation().z))
					.normalize();

				handleCollisionDamage(entity1, event.totalForceMagnitude(), direction, elapsedSeconds);
				handleCollisionDamage(
					entity2,
					event.totalForceMagnitude(),
					direction.negate(),
					elapsedSeconds,
				);

				if (entity1?.components.isTorpedo || entity2?.components.isTorpedo) {
					const torpedoEntity = entity1?.components.isTorpedo ? entity1 : entity2;
					const otherEntity = entity1?.components.isTorpedo ? entity2 : entity1;
					if (torpedoEntity && otherEntity && !torpedoEntity.components.isDestroyed) {
						handleTorpedoDamage(torpedoEntity, otherEntity, direction);
					}
				}
				event.free();
			});
		});

		// Now loop over all of the collision step entities
		// Copy over the properties of each of the bodies to the entities
		for (const entityId of this.collisionStepEntities) {
			const entity = this.ecs.getEntityById(entityId);
			if (!entity) continue;
			const position =
				entity.components.position ||
				(entity.components.satellite && {
					...getOrbitPosition(entity.components.satellite),
					parentId: entity.components.satellite.parentId,
				});
			if (!position) continue;

			const worldPosition = getWorldPosition(position);
			const body = getBodyForEntity(entity);
			if (!body) continue;
			// No need to update fixed bodies.
			if (body.bodyType() === RAPIER.RigidBodyType.Fixed) continue;

			{
				const translation = body.translation();
				tempVector.set(translation.x, translation.y, translation.z);
				const { x, y, z } = worldToUniverse(tempVector, worldPosition);
				entity.updateComponent("position", { x, y, z });
			}
			{
				const { x, y, z, w } = body.rotation();
				entity.updateComponent("rotation", { x, y, z, w });
			}
			{
				const { x, y, z } = body.linvel();
				entity.updateComponent("velocity", { x, y, z });
			}
			{
				const { x, y, z } = body.angvel();
				entity.updateComponent("rotationVelocity", { x, y, z });
			}

			{
				// Set the measured forward velocity
				const { x, y, z } = body.linvel();
				entity.updateComponent("velocity", {
					forwardVelocity: tempVector.set(x, y, z).length(),
				});
			}
		}

		// Now loop over the simple joint entities and snap them to the docking port
		for (const entityId of this.simpleJointEntities) {
			const entity = this.ecs.getEntityById(entityId);
			const joint = this.ecs.getEntityById(entity?.components.isDocked?.jointId || -1);
			if (!joint?.components.fixedJoint) continue;
			const { anchorA, anchorB, frameA, frameB, idA, idB } = joint.components.fixedJoint;
			const shipA = this.ecs.getEntityById(idA);
			const shipB = this.ecs.getEntityById(idB);
			if (!shipA?.components.position || !shipA.components.size || !shipA.components.rotation)
				continue;
			if (!shipB?.components.size || !shipB.components.rotation) continue;
			const { position, rotation } = computeDockedTransform({
				hostPosition: shipA.components.position,
				hostRotation: shipA.components.rotation,
				hostPortPos: anchorA,
				hostPortDir: frameAVec.set(0, 0, 1).applyQuaternion(frameA).toArray(),
				hostScale: shipA.components.size.length,
				guestPortPos: anchorB,
				guestPortDir: frameBVec.set(0, 0, 1).applyQuaternion(frameB).toArray(),
				guestScale: shipB.components.size.length,
				currentGuestRotation: shipB.components.rotation,
			});

			shipB.updateComponent("position", {
				x: position.x,
				y: position.y,
				z: position.z,
				parentId: shipA.components.position.parentId,
				type: shipA.components.position.type,
			});
			shipB.updateComponent("rotation", {
				x: rotation.x,
				y: rotation.y,
				z: rotation.z,
				w: rotation.w,
			});
		}
	}
}
