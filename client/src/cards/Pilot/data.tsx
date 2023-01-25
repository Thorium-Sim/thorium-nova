import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import {getShipSystem} from "@server/utils/getShipSystem";
import {z} from "zod";

export const pilot = t.router({
  impulseEngines: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number}, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        // Currently only support one impulse engines
        const impulseEngines = getShipSystem(ctx, {
          systemType: "impulseEngines",
        });
        return {
          id: impulseEngines.id,
          targetSpeed:
            impulseEngines.components.isImpulseEngines?.targetSpeed || 0,
          cruisingSpeed:
            impulseEngines.components.isImpulseEngines?.cruisingSpeed || 1,
          emergencySpeed:
            impulseEngines.components.isImpulseEngines?.emergencySpeed || 1,
        };
      }),
    setSpeed: t.procedure
      .input(z.object({systemId: z.number().optional(), speed: z.number()}))
      .send(({ctx, input}) => {
        if (!ctx.ship) throw new Error("No ship found.");

        const system = getShipSystem(ctx, {
          systemId: input.systemId,
          systemType: "impulseEngines",
        });

        if (!system.components.isImpulseEngines)
          throw new Error("System is not a impulse engine");

        system.updateComponent("isImpulseEngines", {
          targetSpeed: input.speed,
        });

        pubsub.publish.pilot.impulseEngines.get({
          shipId: ctx.ship?.id,
          systemId: system.id,
        });
        return system;
      }),
  }),
  warpEngines: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number}, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        // Currently only support one impulse engines
        const impulseEngines = getShipSystem(ctx, {
          systemType: "impulseEngines",
        });
        // Currently only support one warp engines
        const warpEngines = getShipSystem(ctx, {systemType: "warpEngines"});
        return {
          id: warpEngines.id,
          warpFactorCount:
            warpEngines.components.isWarpEngines?.warpFactorCount || 5,
          maxVelocity: warpEngines.components.isWarpEngines?.maxVelocity || 0,
          currentWarpFactor:
            warpEngines.components.isWarpEngines?.currentWarpFactor || 0,
          interstellarCruisingSpeed:
            warpEngines.components.isWarpEngines?.interstellarCruisingSpeed ||
            599600000000,
          solarCruisingSpeed:
            warpEngines.components.isWarpEngines?.solarCruisingSpeed ||
            29980000,
        };
      }),
    setWarpFactor: t.procedure
      .input(z.object({systemId: z.number().optional(), factor: z.number()}))
      .send(({ctx, input}) => {
        if (!ctx.ship) throw new Error("No ship found.");

        const system = getShipSystem(ctx, {
          systemId: input.systemId,
          systemType: "warpEngines",
        });
        if (!system.components.isWarpEngines)
          throw new Error("System is not a warp engine");

        system.updateComponent("isWarpEngines", {
          currentWarpFactor: input.factor,
        });

        pubsub.publish.pilot.warpEngines.get({
          shipId: ctx.ship?.id,
          systemId: system.id,
        });
        return system;
      }),
  }),
  autopilot: t.router({
    get: t.procedure
      .filter((publish: {shipId: number}, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        if (!ctx.ship) throw new Error("Ship not found");

        const waypointId = ctx.ship.components.autopilot?.destinationWaypointId;
        let destinationName = "";
        let waypoint;
        if (typeof waypointId === "number") {
          waypoint = ctx.flight?.ecs.getEntityById(waypointId);
          destinationName =
            waypoint?.components.identity?.name
              .replace(" Waypoint", "")
              .trim() || "";
        }
        const waypointParentId = waypoint?.components.position?.parentId;

        const waypointSystemPosition =
          typeof waypointParentId === "number"
            ? ctx.flight?.ecs.getEntityById(waypointParentId)?.components
                .position || null
            : null;

        return {
          forwardAutopilot: ctx.ship.components.autopilot?.forwardAutopilot,
          destinationName,
          destinationPosition: waypoint?.components.position || null,
          destinationSystemPosition: waypointSystemPosition,
          locked: !!ctx.ship.components.autopilot?.desiredCoordinates,
        };
      }),
    lockCourse: t.procedure
      .input(z.object({waypointId: z.number()}))
      .send(({ctx, input}) => {
        if (!ctx.ship) throw new Error("Ship not found.");
        const waypoint = ctx.flight?.ecs.getEntityById(input.waypointId);
        const position = waypoint?.components.position;
        if (!waypoint || !position) throw new Error("Waypoint not found.");

        ctx.ship.updateComponent("autopilot", {
          destinationWaypointId: input.waypointId,
          desiredCoordinates: {x: position.x, y: position.y, z: position.z},
          desiredSolarSystemId: position.parentId,
          rotationAutopilot: true,
          forwardAutopilot: false,
        });

        pubsub.publish.pilot.autopilot.get({shipId: ctx.ship.id});
        pubsub.publish.starmapCore.autopilot({
          systemId: ctx.ship.components.position?.parentId || null,
        });
      }),
    unlockCourse: t.procedure.send(({ctx}) => {
      if (!ctx.ship) throw new Error("Ship not found.");

      ctx.ship.updateComponent("autopilot", {
        destinationWaypointId: null,
        desiredCoordinates: undefined,
        desiredSolarSystemId: undefined,
        rotationAutopilot: false,
        forwardAutopilot: false,
      });

      // Clear out the current thruster adjustments
      const thrusters = ctx.flight?.ecs.entities.find(
        e =>
          e.components.isThrusters &&
          ctx.ship?.components.shipSystems?.shipSystems.has(e.id)
      );
      thrusters?.updateComponent("isThrusters", {
        rotationDelta: {x: 0, y: 0, z: 0},
      });

      pubsub.publish.pilot.autopilot.get({shipId: ctx.ship.id});
      pubsub.publish.starmapCore.autopilot({
        systemId: ctx.ship.components.position?.parentId || null,
      });
    }),
    activate: t.procedure.send(({ctx}) => {
      if (!ctx.ship) throw new Error("Ship not found.");

      ctx.ship.updateComponent("autopilot", {
        forwardAutopilot: true,
      });
      pubsub.publish.pilot.autopilot.get({shipId: ctx.ship.id});
      pubsub.publish.starmapCore.autopilot({
        systemId: ctx.ship.components.position?.parentId || null,
      });
    }),
    deactivate: t.procedure.send(({ctx}) => {
      if (!ctx.ship) throw new Error("Ship not found.");
      ctx.ship.updateComponent("autopilot", {
        forwardAutopilot: false,
      });
      // We specifically won't clear out the impulse and warp because
      // we want the ship to maintain its current speed.
      pubsub.publish.pilot.autopilot.get({shipId: ctx.ship.id});
      pubsub.publish.starmapCore.autopilot({
        systemId: ctx.ship.components.position?.parentId || null,
      });
    }),
  }),
  thrusters: t.router({
    setDirection: t.procedure
      .input(
        z.object({
          systemId: z.number().optional(),
          direction: z.object({
            x: z.number().optional(),
            y: z.number().optional(),
            z: z.number().optional(),
          }),
        })
      )
      .send(({ctx, input}) => {
        const system = getShipSystem(ctx, {
          systemId: input.systemId,
          systemType: "thrusters",
        });
        if (!system.components.isThrusters)
          throw new Error("System is not thrusters");

        const current = system.components.isThrusters.direction;
        system.updateComponent("isThrusters", {
          direction: {
            x:
              typeof input.direction.x === "number"
                ? input.direction.x
                : current.x,
            y:
              typeof input.direction.y === "number"
                ? input.direction.y
                : current.y,
            z:
              typeof input.direction.z === "number"
                ? input.direction.z
                : current.z,
          },
        });

        return system;
      }),
    setRotationDelta: t.procedure
      .input(
        z.object({
          systemId: z.number().optional(),
          rotation: z.object({
            x: z.number().optional(),
            y: z.number().optional(),
            z: z.number().optional(),
          }),
        })
      )
      .send(({ctx, input}) => {
        const system = getShipSystem(ctx, {
          systemId: input.systemId,
          systemType: "thrusters",
        });
        if (!system.components.isThrusters)
          throw new Error("System is not thrusters");

        const current = system.components.isThrusters.rotationDelta;
        system.updateComponent("isThrusters", {
          rotationDelta: {
            x:
              typeof input.rotation.x === "number"
                ? input.rotation.x
                : current.x,
            y:
              typeof input.rotation.y === "number"
                ? input.rotation.y
                : current.y,
            z:
              typeof input.rotation.z === "number"
                ? input.rotation.z
                : current.z,
          },
        });

        // TODO: September 21 2022 - Deactivate the ships autopilot when the thruster rotation change
        return system;
      }),
  }),
  stream: t.procedure
    .input(z.object({systemId: z.number().nullable()}))
    .dataStream(({ctx, input, entity}) => {
      if (!entity) return false;
      const systemId =
        input?.systemId || ctx.ship?.components.position?.parentId;
      if (typeof systemId === "undefined") {
        return false;
      }
      return Boolean(
        (entity.components.position &&
          entity.components.position.parentId === systemId) ||
          ((entity.components.isWarpEngines ||
            entity.components.isImpulseEngines) &&
            ctx.ship?.components.shipSystems?.shipSystems.has(entity.id))
      );
    }),
});
