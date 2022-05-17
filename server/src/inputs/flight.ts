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

const fs = process.env.NODE_ENV === "test" ? {unlink: () => {}} : promises;
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
  startingPoint?: {pluginId: string; startingPointId: string};
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
    context.flight.activatePlugins(true);

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
      const {ship: shipEntity, shipSystems} = spawnShip(
        shipTemplate,
        {
          name: ship.shipName,
          // TODO November 16, 2021 - Implement the position once the
          // universe is implemented
          position: {x: 0, y: 0, z: 0},
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
