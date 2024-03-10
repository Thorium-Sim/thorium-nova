import {Euler, Object3D, Quaternion, Vector3} from "three";
import {type Entity, System} from "../utils/ecs";
import {RAPIER, getWorldPosition} from "../init/rapier";
import {M_TO_KM} from "@server/utils/unitTypes";
import {
  generateRigidBody,
  getEntityWorld,
  universeToWorld,
  worldToUniverse,
} from "@server/init/rapier";
const tempObj = new Object3D();
const tempVector = new Vector3();
const worldVector = new Vector3();
const velocityVector = new Vector3();
const rotationVelocityVector = new Vector3();
const velocityEuler = new Euler();
const velocityQuaternion = new Quaternion();
const BRAKE_CONSTANT = 0.99;

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
  collisionStepEntities = new Set<number>();
  test(entity: Entity) {
    return Boolean(
      (entity.components.position && entity.components.velocity) ||
        (entity.components.rotation && entity.components.rotationVelocity)
    );
  }
  preUpdate(): void {
    this.collisionStepEntities.clear();
  }
  update(entity: Entity, elapsed: number) {
    // Determine whether the entity is using collision or simple physics
    // and update the position accordingly.
    const worldEntity = getEntityWorld(this.ecs, entity);
    const world = worldEntity?.components.physicsWorld?.world;
    const handles = entity.components.physicsHandles?.handles || new Map();

    // Nab some systems to use elsewhere.
    const systems: Entity[] = [];
    entity.components.shipSystems?.shipSystems.forEach((shipSystem, id) => {
      const sys = this.ecs.getEntityById(id);
      if (sys) systems.push(sys);
    });

    const inertialDampener = systems.find(
      sys => sys.components.isInertialDampeners
    );
    const dampening =
      inertialDampener?.components.isInertialDampeners?.dampening || 0;
    const impulseEngines = systems.find(sys => sys.components.isImpulseEngines);
    const forwardImpulse =
      impulseEngines?.components.isImpulseEngines?.forwardImpulse || 0;
    const thrusters = systems.find(sys => sys.components.isThrusters);
    // We don't do collision when traveling at high warp speed
    // Let's say half of solar cruising speed
    const warpEngines = systems.find(sys => sys.components.isWarpEngines);
    const isHighSpeed =
      (warpEngines?.components.isWarpEngines?.forwardVelocity || 0) >
      (warpEngines?.components.isWarpEngines?.solarCruisingSpeed || 0) / 2;

    if (entity.components.rotation) {
      const {x, y, z, w} = entity.components.rotation;
      tempObj.quaternion.set(x, y, z, w);
    }

    if (world) {
      // Make sure the entity in question has a corresponding body in the physics world.
      const handle = handles.get(worldEntity.id);
      let body = typeof handle === "number" && world.bodies.get(handle);
      if (!body) {
        // Generate a body for the component and store the handle on the entity
        body = generateRigidBody(world, entity, this.ecs.colliderCache) || null;
        if (typeof body?.handle === "number") {
          handles.set(worldEntity.id, body.handle);
          entity.updateComponent("physicsHandles", {handles});
        }
      }
      // eslint-disable-next-line no-labels
      if (body && !isHighSpeed) {
        /**
         * Collision Physics
         */
        this.collisionStepEntities.add(entity.id);

        // Transform the position of the body based on the position of the entity relative
        // to the position of the physics world entity.
        if (
          entity.components.position &&
          entity.components.rotation &&
          entity.components.velocity &&
          entity.components.rotationVelocity
        ) {
          let positionVector = tempVector.set(
            entity.components.position.x,
            entity.components.position.y,
            entity.components.position.z
          );

          const worldPosition = getWorldPosition(positionVector);
          positionVector = universeToWorld(positionVector, worldPosition);
          body.setTranslation(positionVector, true);
          body.setRotation(entity.components.rotation, true);
          body.setLinvel(entity.components.velocity, true);
          body.setAngvel(entity.components.rotationVelocity, true);
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
              tempVector.set(
                0,
                0,
                warpEngines.components.isWarpEngines.forwardVelocity
              )
            );
            const linvel = body.linvel();
            body.setLinvel(
              {
                x: warpVelocity.x + linvel.x,
                y: warpVelocity.y + linvel.y,
                z: warpVelocity.z + linvel.z,
              },
              true
            );
          }

          /**
           * Impulse Engines
           */
          body.applyImpulse(
            tempObj.localToWorld(tempVector.set(0, 0, forwardImpulse)),
            true
          );

          /**
           * Thrusters
           */
          if (thrusters?.components.isThrusters) {
            {
              const {x, y, z} =
                thrusters.components.isThrusters.directionImpulse;
              tempVector.set(x, y, z);
              body.applyImpulse(tempObj.localToWorld(tempVector), true);
            }

            // Set the max rotation velocity
            const {x, y, z} = body.angvel();
            if (
              tempVector.set(x, y, z).lengthSq() >
              thrusters.components.isThrusters.rotationMaxSpeed
            ) {
              tempVector.multiplyScalar(BRAKE_CONSTANT);
              const {x, y, z} = tempVector;
              body.setAngvel({x, y, z}, true);
            } else {
              const {x, y, z} =
                thrusters.components.isThrusters.rotationImpulse;

              tempVector.set(x, y, z);
              body.applyTorqueImpulse(tempObj.localToWorld(tempVector), true);
            }
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
      const elapsedRatio = elapsed / 1000;
      const mass = entity.components.mass?.mass || 1;
      {
        const {x, y, z} = entity.components.velocity || {x: 0, y: 0, z: 0};
        velocityVector.set(x, y, z);
      }
      {
        const {x, y, z} = entity.components.rotationVelocity || {
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
       */
      if (warpEngines?.components.isWarpEngines?.forwardVelocity) {
        velocityVector.add(
          tempObj.localToWorld(
            tempVector.set(
              0,
              0,
              warpEngines.components.isWarpEngines.forwardVelocity
            )
          )
        );
      }
      /**
       * Impulse Engines
       */
      velocityVector.add(
        tempObj.localToWorld(
          tempVector
            .set(0, 0, forwardImpulse)
            .divideScalar(mass)
            .multiplyScalar(elapsedRatio)
        )
      );
      /**
       * Thrusters
       */
      if (thrusters?.components.isThrusters) {
        {
          const {x, y, z} = thrusters.components.isThrusters.directionImpulse;
          tempVector.set(x, y, z).multiplyScalar(elapsedRatio * M_TO_KM);
          velocityVector.add(tempObj.localToWorld(tempVector));
        }

        // Set the max rotation velocity
        if (
          rotationVelocityVector.lengthSq() >
          thrusters.components.isThrusters.rotationMaxSpeed
        ) {
          rotationVelocityVector.multiplyScalar(BRAKE_CONSTANT);
        } else {
          const {x, y, z} = thrusters.components.isThrusters.rotationImpulse;

          tempVector.set(x, y, z);

          rotationVelocityVector.add(
            tempVector.divideScalar(mass).multiplyScalar(elapsedRatio)
          );
        }
      }
      /**
       * Apply the velocity to the position
       */
      {
        entity.updateComponent("velocity", {
          x: velocityVector.x,
          y: velocityVector.y,
          z: velocityVector.z,
        });
        const {x, y, z} = entity.components.position || {x: 0, y: 0, z: 0};
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
  postUpdate(_elapsed: number): void {
    // Run the physics simulation for all of the relevant worlds.
    this.ecs.componentCache.get("physicsWorld")?.forEach(entity => {
      const world = entity.components.physicsWorld?.world;
      if (!world) return;
      worldVector.set(
        entity.components.physicsWorld?.location.x || 0,
        entity.components.physicsWorld?.location.y || 0,
        entity.components.physicsWorld?.location.z || 0
      );
      world.step();
      // Copy over the properties of each of the bodies to the entities
      world.bodies.forEach(body => {
        // @ts-expect-error Unknown
        const entity = this.ecs.getEntityById(body.userData?.entityId);
        if (!entity || !this.collisionStepEntities.has(entity.id)) return;
        // No need to update fixed bodies.
        if (body.bodyType() === RAPIER.RigidBodyType.Fixed) return;
        {
          const translation = body.translation();
          const {x, y, z} = worldToUniverse(
            tempVector.set(translation.x, translation.y, translation.z),
            worldVector
          );
          entity.updateComponent("position", {x, y, z});
        }
        {
          const {x, y, z, w} = body.rotation();
          entity.updateComponent("rotation", {x, y, z, w});
        }
        {
          const {x, y, z} = body.linvel();
          entity.updateComponent("velocity", {x, y, z});
        }
        {
          const {x, y, z} = body.angvel();
          entity.updateComponent("rotationVelocity", {x, y, z});
        }

        {
          // Set the measured forward velocity
          const {x, y, z} = body.linvel();
          entity.updateComponent("velocity", {
            forwardVelocity: tempVector.set(x, y, z).length(),
          });
        }
      });
    });
  }
}
