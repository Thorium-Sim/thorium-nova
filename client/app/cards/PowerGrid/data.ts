import {pubsub} from "@server/init/pubsub";
import {t} from "@server/init/t";
import type {Entity} from "@server/utils/ecs";
import {getShipSystems} from "@server/utils/getShipSystem";
import {getReactorInventory} from "@server/utils/getSystemInventory";
import type {MegaWattHour} from "@server/utils/unitTypes";
import {z} from "zod";

export const powerGrid = t.router({
  reactors: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number}, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        const reactors = getShipSystems(ctx, {systemType: "reactor"});
        return reactors.map(r => {
          const inventory = getReactorInventory(r);
          const fuelPower: MegaWattHour =
            inventory?.reduce((prev, next) => {
              return prev + (next.flags.fuel?.fuelDensity || 0) * next.count;
            }, 0) || 0;
          const output = r.components.isReactor!.currentOutput;
          // The reserve is considered full if we can maintain the current output
          // for one hour
          const reserve = Math.min(
            1,
            Math.max(0, fuelPower / (output || Number.EPSILON))
          );

          return {
            id: r.id,
            name: r.components.identity!.name,
            desiredOutput: r.components.isReactor!.desiredOutput,
            maxOutput: r.components.isReactor!.maxOutput,
            optimalOutputPercent: r.components.isReactor!.optimalOutputPercent,
            nominalHeat: r.components.heat!.nominalHeat,
            maxSafeHeat: r.components.heat!.maxSafeHeat,
            maxHeat: r.components.heat!.maxHeat,
            connectedTo: r.components.isReactor!.connectedEntities,
            reserve,
            fuel: r.components.isReactor!.unusedFuel.amount || 0,
          };
        });
      }),
    setDesired: t.procedure
      .input(z.object({reactorId: z.number(), desiredOutput: z.number()}))
      .send(({ctx, input}) => {
        const reactor = ctx.flight?.ecs.getEntityById(input.reactorId);
        if (!reactor?.components.isReactor) return 0;
        reactor.updateComponent("isReactor", {
          desiredOutput: Math.max(
            0,
            Math.min(
              input.desiredOutput,
              reactor.components.isReactor.maxOutput
            )
          ),
        });
        const reactorShip = ctx.flight?.ships.find(s =>
          s.components.shipSystems?.shipSystems.has(input.reactorId)
        );
        if (reactorShip)
          pubsub.publish.powerGrid.reactors.get({
            shipId: reactorShip.id,
            systemId: input.reactorId,
          });
      }),
  }),
  batteries: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number}, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        const batteries = getShipSystems(ctx, {systemType: "battery"});
        return batteries.map(b => ({
          id: b.id,
          capacity: b.components.isBattery!.capacity,
          storage: b.components.isBattery!.storage,
          connectedTo: b.components.isBattery!.connectedNodes,
          chargeAmount: b.components.isBattery!.chargeAmount,
          chargeRate: b.components.isBattery!.chargeRate,
          dischargeAmount: b.components.isBattery!.dischargeAmount,
          dischargeRate: b.components.isBattery!.dischargeRate,
        }));
      }),
  }),
  powerNodes: t.router({
    get: t.procedure
      .filter((publish: {shipId: number; systemId: number}, {ctx}) => {
        if (publish && publish.shipId !== ctx.ship?.id) return false;
        return true;
      })
      .request(({ctx}) => {
        const powerNode = getShipSystems(ctx, {systemType: "powerNode"});
        return powerNode.map(p => ({
          id: p.id,
          name: p.components.identity!.name,
          distributionMode:
            p.components.isPowerNode?.distributionMode || "evenly",
          systemCount: p.components.isPowerNode?.connectedSystems.length,
        }));
      }),
    systems: t.procedure
      .input(z.object({nodeId: z.number()}))
      .filter((publish: {nodeId: number}, {ctx, input}) => {
        if (publish && publish.nodeId !== input.nodeId) return false;
        return true;
      })
      .request(({ctx, input}) => {
        const powerNode = ctx.flight?.ecs.getEntityById(input.nodeId);
        if (!powerNode) return [];

        return powerNode.components.isPowerNode?.connectedSystems
          .map(id => {
            const system = ctx.flight?.ecs.getEntityById(id);
            if (!system) return null;
            return {
              id,
              name: system.components.identity?.name,
              requiredPower: system.components.power?.requiredPower || 0,
              defaultPower: system.components.power?.defaultPower || 0,
              maxSafePower: system.components.power?.maxSafePower || 0,
              currentPower: system.components.power?.currentPower || 0,
              powerDraw: system.components.power?.powerDraw || 0,
              requestedPower: system.components.power?.requestedPower || 0,
            };
          })
          .filter(filterBoolean);
      }),
    setDistributionMode: t.procedure
      .input(
        z.object({
          nodeId: z.number(),
          distributionMode: z.union([
            z.literal("evenly"),
            z.literal("mostFirst"),
            z.literal("leastFirst"),
          ]),
        })
      )
      .send(({input, ctx}) => {
        const powerNode = ctx.flight?.ecs.getEntityById(input.nodeId);
        if (!powerNode?.components.isPowerNode) return;
        powerNode.updateComponent("isPowerNode", {
          distributionMode: input.distributionMode,
        });

        const powerNodeShip = ctx.flight?.ships.find(s =>
          s.components.shipSystems?.shipSystems.has(input.nodeId)
        );
        if (powerNodeShip) {
          pubsub.publish.powerGrid.powerNodes.get({
            systemId: powerNode.id,
            shipId: powerNodeShip.id,
          });
        }
      }),
    setRequestedPower: t.procedure
      .input(
        z.object({
          systemId: z.number(),
          nodeId: z.number(),
          requestedPower: z.number(),
        })
      )
      .send(({input, ctx}) => {
        const system = ctx.flight?.ecs.getEntityById(input.systemId);
        if (!system?.components.power) return;
        system.updateComponent("power", {
          requestedPower: Math.max(0, input.requestedPower),
        });
        pubsub.publish.powerGrid.powerNodes.systems({nodeId: input.nodeId});
      }),
    transferSystem: t.procedure
      .input(
        z.object({
          systemId: z.number(),
          nodeId: z.number(),
        })
      )
      .send(({input, ctx}) => {
        const powerNodeShip = ctx.flight?.ships.find(s =>
          s.components.shipSystems?.shipSystems.has(input.nodeId)
        );

        if (powerNodeShip) {
          const originalPowerNode = Array.from(
            powerNodeShip.components.shipSystems?.shipSystems.keys() || []
          ).reduce((prev: null | Entity, id) => {
            if (prev) return prev;
            const system = ctx.flight?.ecs.getEntityById(id);
            if (
              system?.components.isPowerNode?.connectedSystems.includes(
                input.systemId
              )
            )
              return system;
            return null;
          }, null);

          originalPowerNode?.updateComponent("isPowerNode", {
            connectedSystems:
              originalPowerNode.components.isPowerNode?.connectedSystems.filter(
                sys => sys !== input.systemId
              ) || [],
          });

          const newPowerNode = ctx.flight?.ecs.getEntityById(input.nodeId);
          newPowerNode?.updateComponent("isPowerNode", {
            connectedSystems: [
              ...(newPowerNode.components.isPowerNode?.connectedSystems || []),
              input.systemId,
            ],
          });

          pubsub.publish.powerGrid.powerNodes.get({
            systemId: input.nodeId,
            shipId: powerNodeShip.id,
          });
        }
        pubsub.publish.powerGrid.powerNodes.systems({nodeId: input.nodeId});
      }),
  }),
  stream: t.procedure.dataStream(({ctx, entity}) => {
    if (!entity) return false;
    return Boolean(
      (entity.components.isReactor ||
        entity.components.isBattery ||
        entity.components.isPowerNode) &&
        ctx.ship?.components.shipSystems?.shipSystems.has(entity.id)
    );
  }),
  connectNodes: t.procedure
    .input(z.object({out: z.number(), in: z.number()}))
    .send(({ctx, input}) => {
      const entity = ctx.flight?.ecs.getEntityById(input.out);
      const entityShip = ctx.flight?.ships.find(s =>
        s.components.shipSystems?.shipSystems.has(entity?.id || -1)
      );
      if (entity?.components.isReactor) {
        if (entity.components.isReactor.connectedEntities.includes(input.in))
          return;
        entity.components.isReactor.connectedEntities.push(input.in);

        if (entityShip)
          pubsub.publish.powerGrid.reactors.get({
            shipId: entityShip.id,
            systemId: entity.id,
          });
      }
      if (entity?.components.isBattery) {
        if (entity.components.isBattery.connectedNodes.includes(input.in))
          return;
        entity.components.isBattery.connectedNodes.push(input.in);

        if (entityShip)
          pubsub.publish.powerGrid.batteries.get({
            shipId: entityShip.id,
            systemId: entity.id,
          });
      }
    }),
  disconnectNodes: t.procedure
    .input(z.object({out: z.number(), in: z.number()}))
    .send(({ctx, input}) => {
      const entity = ctx.flight?.ecs.getEntityById(input.out);
      const entityShip = ctx.flight?.ships.find(s =>
        s.components.shipSystems?.shipSystems.has(entity?.id || -1)
      );
      if (entity?.components.isReactor) {
        entity.components.isReactor.connectedEntities =
          entity.components.isReactor.connectedEntities.filter(
            id => id !== input.in
          );
        if (entityShip)
          pubsub.publish.powerGrid.reactors.get({
            shipId: entityShip.id,
            systemId: entity.id,
          });
      }

      if (entity?.components.isBattery) {
        entity.components.isBattery.connectedNodes =
          entity.components.isBattery.connectedNodes.filter(
            id => id !== input.in
          );

        if (entityShip)
          pubsub.publish.powerGrid.batteries.get({
            shipId: entityShip.id,
            systemId: entity.id,
          });
      }
    }),
});

function filterBoolean<T>(val: T | null | undefined): val is T {
  return Boolean(val);
}
