import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import {matchSorter} from "match-sorter";
import ShipPlugin from "server/src/classes/Plugins/Ship";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {Coordinates} from "server/src/utils/unitTypes";
import {z} from "zod";

export const starmapCore = t.router({
  systems: t.procedure.request(({ctx}) => {
    if (!ctx.flight) return [];
    const data = ctx.flight.ecs.entities.reduce(
      (prev: Pick<Entity, "components" | "id">[], {components, id}) => {
        if (components.isSolarSystem) prev.push({components, id});
        return prev;
      },
      []
    );
    return data;
  }),
  system: t.procedure
    .input(z.object({systemId: z.number()}))
    .request(({ctx, input}) => {
      if (!ctx.flight) throw new Error("No flight in progress");
      const data = ctx.flight.ecs.getEntityById(input.systemId);
      if (!data?.components.isSolarSystem)
        throw new Error("Not a solar system");
      return {id: data.id, components: data.components};
    }),
  /** Includes all the things in a system that isn't a ship */
  entities: t.procedure
    .input(z.object({systemId: z.number().nullable()}))
    .request(({ctx, input}) => {
      if (!ctx.flight) return [];
      if (input?.systemId === null || input?.systemId === undefined) return [];
      const data = ctx.flight.ecs.entities.reduce(
        (prev: Pick<Entity, "components" | "id">[], {components, id}) => {
          if (components.isShip) return prev;
          if (
            components.position?.parentId === input.systemId ||
            components.satellite?.parentId === input.systemId
          )
            prev.push({components, id});
          return prev;
        },
        []
      );
      return data;
    }),
  /** Includes all the ship in a system or interstellar space */
  ships: t.procedure
    .input(z.object({systemId: z.number().nullable()}))
    .filter((publish: {systemId: number | null}, {input}) => {
      if (!publish) return true;
      if (!publish.systemId && !input.systemId) return true;
      if (publish.systemId === input.systemId) return true;
      return false;
    })
    .request(({ctx, input}) => {
      if (!ctx.flight) return [];
      const data = ctx.flight.ecs.entities.reduce(
        (
          prev: {
            id: number;
            modelUrl?: string;
            logoUrl?: string;
            size: number;
          }[],
          {components, id}
        ) => {
          if (components.isShip) {
            if (
              (typeof input?.systemId === "number" &&
                components.position?.parentId === input.systemId) ||
              (input?.systemId === undefined &&
                components.position?.type === "interstellar")
            ) {
              prev.push({
                id,
                modelUrl: components.isShip.assets.model,
                logoUrl: components.isShip.assets.logo,
                size: components.size?.length || 50,
              });
            }
          }
          return prev;
        },
        []
      );

      return data;
    }),
  /** Useful for fetching a single ship when following that ship */
  ship: t.procedure
    .input(z.object({shipId: z.number().optional().nullish()}))
    .filter((publish: {shipId: number | null}, {input}) => {
      if (!input.shipId) return true;
      if (publish && publish.shipId !== input.shipId) return false;

      return true;
    })
    .request(({ctx, input}) => {
      if (!input.shipId) return null;
      if (!ctx.flight) return null;

      const entity = ctx.flight.ecs.getEntityById(input.shipId);
      if (!entity) return null;
      return {id: entity.id, systemId: entity.components.position?.parentId};
    }),
  spawnSearch: t.procedure
    .input(z.object({query: z.string()}))
    .request(({ctx, input}) => {
      if (!ctx.flight) return [];
      const shipTemplates = ctx.server.plugins
        .filter(p => ctx.flight?.pluginIds.includes(p.id))
        .reduce((acc: ShipPlugin[], plugin) => {
          return acc.concat(plugin.aspects.ships);
        }, []);

      // TODO August 20, 2022: Add faction here too
      return matchSorter(shipTemplates, input.query, {
        keys: ["name", "description", "category", "tags"],
      })
        .slice(0, 10)
        .map(({pluginName, name, category, assets: {vanity}}) => ({
          id: name,
          pluginName,
          name,
          category,
          vanity,
        }));
    }),
  autopilot: t.procedure
    .input(z.object({systemId: z.number().nullable()}))
    .filter((publish: {systemId: number | null}, {input}) => {
      if (publish && publish.systemId !== input.systemId) return false;
      return true;
    })
    .request(({ctx, input}) => {
      const autopilotSystem = ctx.flight?.ecs.systems.find(
        system => system.constructor.name === "AutoThrustSystem"
      );
      const ships = autopilotSystem?.entities.filter(
        entity => entity.components.position?.parentId === input.systemId
      );

      type AutopilotInfo = {
        forwardAutopilot: boolean;
        destinationName: string;
        destinationPosition: Coordinates<number> | null;
        destinationSystemPosition: Coordinates<number> | null;
        locked: boolean;
      };

      return (
        ships?.reduce((acc: {[id: number]: AutopilotInfo}, ship) => {
          const waypointId = ship.components.autopilot?.destinationWaypointId;
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

          acc[ship.id] = {
            forwardAutopilot: !!ship.components.autopilot?.forwardAutopilot,
            destinationName,
            destinationPosition:
              ship.components.autopilot?.desiredCoordinates || null,
            destinationSystemPosition: waypointSystemPosition,
            locked: !!ship.components.autopilot?.desiredCoordinates,
          };
          return acc;
        }, {}) || {}
      );
    }),
  setDestinations: t.procedure
    .input(
      z.object({
        ships: z
          .object({
            id: z.number(),
            position: z.object({x: z.number(), y: z.number(), z: z.number()}),
            systemId: z.number().nullable(),
          })
          .array(),
      })
    )
    .send(({ctx, input}) => {
      const systemIds = new Set<number | null>();

      input.ships.forEach(ship => {
        const entity = ctx.flight?.ecs.getEntityById(ship.id);
        entity?.updateComponent("autopilot", {
          desiredCoordinates: ship.position,
          desiredSolarSystemId: ship.systemId,
        });
        if (typeof entity?.components.position?.parentId !== "undefined") {
          systemIds.add(entity.components.position.parentId);
        }
        pubsub.publish.pilot.autopilot.get({shipId: ship.id});
      });

      systemIds.forEach(id => {
        pubsub.publish.starmapCore.autopilot({systemId: id});
      });
    }),
  stream: t.procedure
    .input(z.object({systemId: z.number().nullable()}))
    .dataStream(({entity, input}) => {
      if (!entity) return false;
      if (entity.components.isShip && entity.components.position) {
        if (
          entity.components.position.type === "interstellar" &&
          (input.systemId === null || input.systemId === undefined)
        )
          return true;
        if (entity.components.position.parentId === input.systemId) {
          return true;
        }
      }
      return false;
    }),
});
