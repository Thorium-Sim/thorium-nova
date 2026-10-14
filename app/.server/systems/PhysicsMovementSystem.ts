import {
	handleCollisionDamage,
	handleTorpedoDamage,
} from "@thorium/utils/.server/ship/collisionDamage";
import { computeDockedTransform } from "@thorium/utils/dockingClient";
import { type Entity, System } from "@thorium/utils/ecs";
import { getRigidBody } from "@thorium/utils/physics/getRigidBody";
import { collidersInited } from "@thorium/utils/physics/initColliders";
import { getPhysicsWorld } from "@thorium/utils/physics/world";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { getObjectSystem } from "@thorium/utils/starmap/position";
import { KM_TO_LM, M_TO_KM, rpmToRadianPerSecond } from "@thorium/utils/unitTypes";
import { MotionType, rigidBody, updateWorld, type Listener, type World } from "crashcat";
import { Euler, Object3D, Quaternion, Vector3 } from "three";

const tempObj = new Object3D();
const tempVector = new Vector3();
const velocityVector = new Vector3();
const rotationVelocityVector = new Vector3();
const velocityEuler = new Euler();
const velocityQuaternion = new Quaternion();
const BRAKE_CONSTANT = 0.99;

const PHYSICS_DT = 1 / 60;

const bodyAVec = new Vector3();
const bodyBVec = new Vector3();
/**
 * This system applies the physics of anything flying through space
 * So ships, asteroids, projectiles, etc.
 *
 * There are two physics systems in the game:
 * 1. crashcat - This is the main physics system. It's used for
 *   everything that's in the same physics world as the player.
 * 2. Simple - This is a simple physics system that doesn't include
 *  collisions. It's used for everything that's not in the same
 *  physics world as the player.
 */
export class PhysicsMovementSystem extends System {
	static flightMode = ["nova"];
	timeAccumulator = 0;
	worlds = new Set<World>();
	collisionStepEntities = new Set<number>();
	simpleJointEntities = new Set<number>();
	pendingDamage: {
		entityId: number;
		direction: [number, number, number];
		amount: number;
		type: "collision" | "torpedo";
	}[] = [];
	test(entity: Entity) {
		return Boolean(
			(entity.components.position && entity.components.velocity) ||
			(entity.components.rotation && entity.components.rotationVelocity),
		);
	}
	preUpdate(): void {
		this.worlds.clear();
		this.collisionStepEntities.clear();
		this.simpleJointEntities.clear();
	}
	updateAll(elapsed: number, updateCounter: number) {
		super.updateAll(elapsed, updateCounter);
	}
	update(entity: Entity, elapsed: number) {
		if (!collidersInited) return;

		// Determine whether the entity is using collision or simple physics
		// and update the position accordingly.
		const solarSystemId = getObjectSystem(entity)?.id || -1;
		const world = getPhysicsWorld(solarSystemId);

		this.worlds.add(world);
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
			const body = getRigidBody(entity);

			if (body && !isHighSpeed) {
				/**
				 * Collision Physics
				 */
				this.collisionStepEntities.add(entity.id);
				const { position, rotation, velocity, rotationVelocity } = entity.components;

				// No need to do an update if this ship is docked with another ship
				// Transform the position of the body based on the position of the entity relative
				// to the position of the physics world entity.
				if (position && rotation) {
					rigidBody.setTransform(
						world,
						body,
						[position.x, position.y, position.z],
						[rotation.x, rotation.y, rotation.z, rotation.w],
						true,
					);
				}
				if (velocity) {
					rigidBody.setLinearVelocity(world, body, [velocity.x, velocity.y, velocity.z]);
				}
				if (rotationVelocity) {
					rigidBody.setAngularVelocity(world, body, [
						rotationVelocity.x,
						rotationVelocity.y,
						rotationVelocity.z,
					]);
				}

				/**
				 * Inertial Dampeners
				 */

				body.motionProperties.linearDamping = dampening;
				body.motionProperties.angularDamping = dampening;

				// No need to do further calculations if this entity is docked, since its body is attached to the parent entity
				// and will be dragged around with the joint during the world update phase
				if (entity.components.isDocked) return;

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
						body.motionProperties.maxLinearVelocity =
							(warpEngines?.components.isWarpEngines?.interstellarCruisingSpeed || 599600000000) *
							1000; // km/s to m/s
						rigidBody.setLinearVelocity(world, body, warpVelocity.toArray());
					}
				}

				/**
				 * Impulse Engines
				 */
				if (forwardImpulse) {
					body.motionProperties.maxLinearVelocity =
						(impulseEngines?.components.isImpulseEngines?.emergencySpeed || 2000) * 1000; // km/s to m/s
					rigidBody.addImpulse(
						world,
						body,
						tempObj.localToWorld(tempVector.set(0, 0, forwardImpulse)).toArray(),
					);
				}

				/**
				 * Thrusters
				 */
				if (thrusters?.components.isThrusters) {
					{
						const { x, y, z } = thrusters.components.isThrusters.directionImpulse;
						tempVector.set(x, y, z);
						rigidBody.addImpulse(world, body, tempObj.localToWorld(tempVector).toArray());
					}
					{
						const { x, y, z } = thrusters.components.isThrusters.rotationImpulse;
						tempVector.set(x, y, z);
						body.motionProperties.maxAngularVelocity = rpmToRadianPerSecond(
							thrusters.components.isThrusters.rotationMaxSpeed,
						);
						rigidBody.addAngularImpulse(
							world,
							body,
							tempObj.localToWorld(tempVector).toArray(),
							// true,
						);
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
	worldListener: Listener = {
		onContactAdded: (bodyA, bodyB, manifold, settings) => {
			const entityIdA = (bodyA?.userData as any)?.entityId;
			const entityIdB = (bodyB?.userData as any)?.entityId;
			const entityA = this.ecs.getEntityById(entityIdA);
			const entityB = this.ecs.getEntityById(entityIdB);

			// This is basically a collision of the mass of a small ship at 1km/s
			const MIN_IMPULSE = 1000 / (1 / 700000);
			const DAMAGE_SCALE = 1;

			bodyAVec
				.set(...bodyA.position)
				.sub(bodyBVec.set(...bodyB.position))
				.normalize();

			const n = manifold.worldSpaceNormal; // points from A to B

			const vA = bodyA.motionProperties.linearVelocity;
			const vB = bodyB.motionProperties.linearVelocity;

			// closing speed along the normal (positive = approaching)
			const closingSpeed = (vA[0] - vB[0]) * n[0] + (vA[1] - vB[1]) * n[1] + (vA[2] - vB[2]) * n[2];
			if (closingSpeed <= 0) return;

			const invMassSum = bodyA.motionProperties.invMass + bodyB.motionProperties.invMass;
			if (invMassSum === 0) return;

			const impulse = ((1 + settings.combinedRestitution) * closingSpeed) / invMassSum;

			if (impulse < MIN_IMPULSE) return;

			const damage = (impulse - MIN_IMPULSE) * DAMAGE_SCALE;

			handleCollisionDamage(entityA, damage, bodyAVec, PHYSICS_DT);

			if (entityA?.components.isTorpedo || entityB?.components.isTorpedo) {
				const torpedoEntity = entityA?.components.isTorpedo ? entityA : entityB;
				const otherEntity = entityA?.components.isTorpedo ? entityB : entityA;
				if (torpedoEntity && otherEntity && !torpedoEntity.components.isDestroyed) {
					handleTorpedoDamage(torpedoEntity, otherEntity, bodyAVec);
				}
			}
			handleCollisionDamage(entityB, damage, bodyAVec.negate(), PHYSICS_DT);
		},
		onBodyPairValidate: (bodyA, bodyB) => {
			const entityIdA = (bodyA?.userData as any)?.entityId;
			const entityIdB = (bodyB?.userData as any)?.entityId;
			// no self-collisions
			if (entityIdA === entityIdB) return false;
			const entityA = this.ecs.getEntityById(entityIdA);
			const entityB = this.ecs.getEntityById(entityIdB);

			// Docked ships don't collide
			if (
				entityA?.components.isDocked?.hostShipId === entityIdB ||
				entityB?.components.isDocked?.hostShipId === entityIdA
			) {
				return false;
			}

			// Special handling to ignore torpedoes their own ships
			if (entityA?.components.isTorpedo || entityB?.components.isTorpedo) {
				const entity = entityA?.components.isTorpedo ? entityA : entityB;
				const otherEntity = entityA?.components.isTorpedo ? entityB : entityA;
				const launcher = this.ecs.getEntityById(entity?.components.isTorpedo?.launcherId || -1);
				const ship = this.ecs.getEntityById(launcher?.components.isShipSystem?.shipId || -1);
				if (ship?.id !== undefined && ship.id === otherEntity?.id) {
					return false;
				}
			}
			return true; // allow collision
		},
	};
	postUpdate(elapsed: number): void {
		const elapsedSeconds = Math.min(elapsed / 1000, 0.25);
		this.timeAccumulator += elapsedSeconds;

		while (this.timeAccumulator >= PHYSICS_DT) {
			// Run the physics simulation for all of the relevant worlds.
			this.worlds.forEach((world) => {
				updateWorld(world, this.worldListener, PHYSICS_DT);
			});

			this.timeAccumulator -= PHYSICS_DT;
		}

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

			const body = getRigidBody(entity);
			if (!body) continue;
			// No need to update fixed bodies.
			if (body.motionType === MotionType.STATIC) continue;

			{
				const [x, y, z] = body.position;
				entity.updateComponent("position", { x, y, z });
			}
			{
				const [x, y, z, w] = body.quaternion;
				entity.updateComponent("rotation", { x, y, z, w });
			}
			{
				const [x, y, z] = body.motionProperties.linearVelocity;
				entity.updateComponent("velocity", {
					forwardVelocity: tempVector.set(x, y, z).length(),
				});
				entity.updateComponent("velocity", { x, y, z });
			}
			{
				const [x, y, z] = body.motionProperties.angularVelocity;
				entity.updateComponent("rotationVelocity", { x, y, z });
			}
		}

		// Now loop over the simple joint entities and snap them to the docking port
		for (const entityId of this.simpleJointEntities) {
			const entity = this.ecs.getEntityById(entityId);
			const joint = this.ecs.getEntityById(entity?.components.isDocked?.jointId || -1);
			if (!joint?.components.fixedConstraint) continue;
			const { anchorA, anchorB, frameA, frameB, idA, idB } = joint.components.fixedConstraint;
			const shipA = this.ecs.getEntityById(idA);
			const shipB = this.ecs.getEntityById(idB);
			if (!shipA?.components.position || !shipA.components.size || !shipA.components.rotation)
				continue;
			if (!shipB?.components.size || !shipB.components.rotation) continue;
			const { position, rotation } = computeDockedTransform({
				hostPosition: shipA.components.position,
				hostRotation: shipA.components.rotation,
				hostPortPos: anchorA,
				hostPortDir: frameA,
				hostScale: 1,
				guestPortPos: anchorB,
				guestPortDir: frameB,
				guestScale: 1,
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
