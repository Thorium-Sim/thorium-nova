import type {DataContext} from "../utils/DataContext";
import {FlightDataModel} from "../classes/FlightDataModel";
import randomWords from "@thorium/random-words";
import {pubsub} from "../utils/pubsub";
import {thoriumPath} from "../utils/appPaths";
import {promises} from "fs";
import {spawnShip} from "../spawners/ship";
import type ShipPlugin from "../classes/Plugins/Ship";
import type StationComplementPlugin from "../classes/Plugins/StationComplement";
import {generateIncrementedName} from "../utils/generateIncrementedName";
import {getFlights} from "../utils/getFlights";
import type BasePlugin from "../classes/Plugins";
import inputAuth from "../utils/inputAuth";
import {FlightStartingPoint} from "../utils/types";
import {spawnSolarSystem} from "../spawners/solarSystem";
import {Entity} from "../utils/ecs";
import {getOrbitPosition} from "../utils/getOrbitPosition";
import {Vector3} from "three";
import {PositionComponent} from "../components/position";

const fs = process.env.NODE_ENV === "test" ? {unlink: () => {}} : promises;

function getPlanetSystem(context: DataContext, planet: Entity): Entity {
  if (!planet.components?.satellite?.parentId)
    throw new Error("No satellite parentId");
  const parentEntity = context.flight?.ecs.getEntityById(
    planet.components?.satellite?.parentId
  );
  if (!parentEntity)
    throw new Error(
      `Could not find parent entity for planet: ${JSON.stringify(planet)} `
    );
  if (parentEntity.components.isSolarSystem) return parentEntity;
  return getPlanetSystem(context, parentEntity);
}
interface FlightStartShips {
  shipTemplate: {pluginId: string; shipId: string};
  shipName: string;
  crewCount: number;
  theme?: {pluginId: string; themeId: string};
  stationComplement?: {pluginId: string; stationId: string};
  // TODO November 15, 2021 - Implement the mission once missions
  // are actually a thing
  missionName?: {pluginId: string; missionId: string};
  // TODO November 15, 2021 - Implement the starting point once
  // the universe is implemented
  /**
   * The Name or ID of the starting point of the mission
   * in the universe.
   */
  startingPoint?: FlightStartingPoint;
}
export const flightInputs = {
  flightStart: async (
    context: DataContext,
    {
      flightName,
      ships,
    }: {
      flightName: string;
      ships: FlightStartShips[];
    }
  ) => {
    inputAuth(context);
    if (context.flight) return context.flight;
    const flightData = await getFlights();
    flightName = generateIncrementedName(
      flightName || randomWords(3).join("-"),
      flightData.map(f => f.name)
    );

    context.flight = new FlightDataModel(
      {
        name: flightName,
        initialLoad: true,
        entities: [],
        serverDataModel: context.server,
      },
      {path: `/flights/${flightName}.flight`}
    );

    context.flight.initEcs(context.server);
    const activePlugins = context.server.plugins.filter(p => p.active);
    context.flight.pluginIds = activePlugins.map(p => p.id);

    // This will spawn all of the systems and planets bundled with the plugins
    const solarSystemMap = context.flight.pluginIds.reduce(
      (map: Record<string, Entity>, pluginId) => {
        const plugin = context.server.plugins.find(
          plugin => plugin.id === pluginId
        );
        if (!plugin) return map;
        // Create entities for the universe objects
        plugin.aspects.solarSystems.forEach(solarSystem => {
          const entities = spawnSolarSystem(solarSystem);
          entities.forEach(object => {
            const {entity} = object;
            context.flight?.ecs.addEntity(entity);
            let key = `${object.pluginId}-${object.pluginSystemId}`;
            if (object.type === "planet" || object.type === "star") {
              key += `-${object.objectId}`;
            }
            map[key] = entity;
          });
        });
        return map;
      },
      {}
    );

    // Spawn the ships that were defined when the flight was started
    for (const ship of ships) {
      const shipTemplate = activePlugins.reduce(
        (acc: ShipPlugin | null, plugin) => {
          if (acc) return acc;
          if (plugin.id !== ship.shipTemplate.pluginId) return acc;
          return (
            plugin.aspects.ships.find(
              pluginShip => pluginShip.name === ship.shipTemplate.shipId
            ) || null
          );
        },
        null
      );
      if (!shipTemplate) continue;
      let position: Omit<PositionComponent, "init"> = {
        x: 0,
        y: 0,
        z: 0,
        type: "interstellar",
        parentId: null,
      };
      if (ship.startingPoint) {
        context.flight.ecs.entities.forEach(e => {
          try {
            if (!ship.startingPoint) throw new Error("No starting point");
            const key = `${ship.startingPoint.pluginId}-${ship.startingPoint.solarSystemId}-${ship.startingPoint.objectId}`;
            const startingEntity = solarSystemMap[key];
            if (!startingEntity)
              throw new Error(`Could not find entity for ${key}`);
            if (!startingEntity.components.satellite)
              throw new Error(`${key} is not a satellite`);
            let origin = new Vector3();
            if (startingEntity.components.satellite.parentId) {
              const parent = context.flight?.ecs.getEntityById(
                startingEntity.components.satellite.parentId
              );
              if (parent?.components.satellite)
                origin = getOrbitPosition(parent.components.satellite);
            }
            const objectPosition = startingEntity.components?.position ||
              (startingEntity.components?.satellite &&
                getOrbitPosition({
                  ...startingEntity.components.satellite,
                  origin,
                })) || {
                x: -0.5 * Math.random() * 100000000,
                y: -0.5 * Math.random() * 10000,
                z: -0.5 * Math.random() * 100000000,
              };
            const startObjectScale =
              startingEntity.components?.isPlanet?.radius ||
              (startingEntity.components.size &&
                Math.max(
                  startingEntity.components.size.height,
                  startingEntity.components.size.length,
                  startingEntity.components.size.width
                ) / 1000) ||
              1;
            const distanceVector = new Vector3(
              startObjectScale * 2 + (Math.random() - 0.5) * startObjectScale,
              0,
              startObjectScale * 2 + (Math.random() - 0.5) * startObjectScale
            );
            const parentSystem = getPlanetSystem(context, startingEntity);
            position = {
              x: objectPosition.x + distanceVector.x,
              y: objectPosition.y,
              z: objectPosition.z + distanceVector.z,
              type: "solar",
              parentId: parentSystem.id,
            };
            // TODO May 18 2022 Once docking gets sorted out, make it so the ship can start out docked with a starbase.
          } catch (e) {
            if (e instanceof Error) {
              console.error(e);
            }
          }
        });
      }
      const {ship: shipEntity, shipSystems} = spawnShip(
        shipTemplate,
        {
          name: ship.shipName,
          position,
          tags: ["player"],
        },
        context.server.plugins.filter(p =>
          context.flight?.pluginIds.includes(p.id)
        )
      );

      shipSystems.forEach(s => context.flight?.ecs.addEntity(s));
      shipEntity.addComponent("isPlayerShip");
      let theme = ship.theme || null;
      if (!theme) {
        theme = activePlugins.reduce(
          (acc: {pluginId: string; themeId: string} | null, plugin) => {
            if (acc) return acc;
            const theme = plugin.aspects?.themes?.[0];
            if (!theme) return null;
            return {pluginId: plugin.id, themeId: theme.name};
          },
          null
        );
      }
      if (theme) {
        shipEntity.addComponent("theme", theme);
      }

      // First see if there is a station complement
      // that matches the specific one that was passed in
      let stationComplement = getStationComplement(activePlugins, ship);
      shipEntity.addComponent("stationComplement", {
        stations:
          stationComplement?.stations.map(s => ({
            ...s,
            logo: stationComplement?.assets[`${s.name}-logo`] || "",
            cards: s.cards.map(c => {
              return {
                ...c,
                icon: stationComplement?.assets[`${s.name}-${c.name}-icon`],
              };
            }),
          })) || [],
      });

      context.flight.ecs.addEntity(shipEntity);
    }
    context.server.activeFlightName = flightName;
    pubsub.publish("flight");
    return context.flight;
  },
  spawnShip(context: DataContext) {
    const shipTemplate = context.server.plugins[0].aspects.ships[0];
    const {ship: shipEntity, shipSystems} = spawnShip(
      shipTemplate,
      {
        name: "Test Ship",
        position: {
          x: 0,
          y: 0,
          z: 0,
          type: "interstellar",
          parentId: null,
        },
      },
      context.server.plugins.filter(p =>
        context.flight?.pluginIds.includes(p.id)
      )
    );
    shipSystems.forEach(s => context.flight?.ecs.addEntity(s));
    context.flight?.ecs.addEntity(shipEntity);
    pubsub.publish("starmapShips");
  },
  flightLoad(context: DataContext, params: {flightName: string}) {
    inputAuth(context);
    if (context.flight) return context.flight;

    context.flight = new FlightDataModel(
      {
        entities: [],
        initialLoad: false,
        serverDataModel: context.server,
      },
      {path: `/flights/${params.flightName}.flight`}
    );
    context.flight.initEcs(context.server);

    context.server.activeFlightName = params.flightName;
    pubsub.publish("flight");
    return context.flight;
  },
  flightPause(context: DataContext) {
    if (context.flight) {
      context.flight.paused = true;
    }
    pubsub.publish("flight");
    return context.flight;
  },
  flightResume(context: DataContext) {
    if (context.flight) {
      context.flight.paused = false;
    }
    pubsub.publish("flight");
    return context.flight;
  },
  flightReset(context: DataContext) {
    context.flight?.reset();
    pubsub.publish("flight");
    return context.flight;
  },
  flightStop(context: DataContext): null {
    inputAuth(context);
    // Save the flight, but don't delete it.
    if (!context.flight) return null;
    context.flight.paused = false;

    context.flight.writeFile();

    context.flight = null;
    context.server.activeFlightName = null;
    // TODO September 1, 2021 - Stop broadcasting this flight with Bonjour.
    pubsub.publish("flight");
    return null;
  },
  async flightDelete(
    context: DataContext,
    {flightName}: {flightName: string}
  ): Promise<null> {
    inputAuth(context);
    if (context.flight?.name === flightName) {
      context.flight = null;
      context.server.activeFlightName = null;
    }
    try {
      await fs.unlink(`${thoriumPath}/flights/${flightName}.flight`);
    } catch {
      // Do nothing; the file probably didn't exist.
    }
    pubsub.publish("flight");
    pubsub.publish("flights");
    return null;
  },
};
function getStationComplement(
  activePlugins: BasePlugin[],
  ship: FlightStartShips
) {
  let stationComplement = activePlugins.reduce(
    (acc: StationComplementPlugin | null, plugin) => {
      if (acc) return acc;
      if (
        ship.stationComplement &&
        plugin.id !== ship.stationComplement.pluginId
      )
        return acc;
      if (ship.stationComplement) {
        return (
          plugin.aspects.stationComplements.find(
            pluginStationComplement =>
              pluginStationComplement.name === ship.stationComplement?.stationId
          ) || null
        );
      }
      return null;
    },
    null
  );
  // No station complement? Find the one that best fits from the default plugin
  if (!stationComplement) {
    stationComplement = activePlugins.reduce(
      (acc: StationComplementPlugin | null, plugin) => {
        if (acc) return acc;
        if (!plugin.default) return acc;
        // TODO November 18, 2021 - Check to see if the ship is a big ship or a little ship
        // and assign the appropriate station complement based on that.
        return (
          plugin.aspects.stationComplements.find(
            pluginStationComplement =>
              pluginStationComplement.stationCount === ship.crewCount
          ) || null
        );
      },
      null
    );
  }
  return stationComplement;
}
