import type {DataContext} from "../utils/DataContext";
import {FlightDataModel} from "../classes/FlightDataModel";
import randomWords from "@thorium/random-words";
import {pubsub} from "../utils/pubsub";
import {thoriumPath} from "../utils/appPaths";
import fs from "fs/promises";
import {spawnShip} from "../spawners/ship";
import type ShipPlugin from "../classes/Plugins/Ship";
interface FlightStartShips {
  shipTemplate: {pluginId: string; shipId: string};
  shipName: string;
  crewCount: number;
  stationComplementName?: {pluginId: string; stationId: string};
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
  flightStart: (
    context: DataContext,
    {
      flightName,
      ships,
    }: {
      flightName: string;
      ships: FlightStartShips[];
    }
  ) => {
    if (context.flight) return context.flight;
    flightName = flightName || randomWords(3).join("-");
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
    // TODO September 1, 2021 - We can uncomment this when the plugin system is done
    // context.flight.activatePlugins(true)

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
      const shipEntity = spawnShip(shipTemplate, {
        name: ship.shipName,
        // TODO November 16, 2021 - Implement the position once the
        // universe is implemented
        position: {x: 0, y: 0, z: 0},
        tags: ["player"],
      });
      shipEntity.addComponent("isPlayerShip");

      // TODO November 16, 2021 - Implement the station complement component
      // once the other pull requests have been merged.
      context.flight.ecs.addEntity(shipEntity);
    }
    context.server.activeFlightName = flightName;
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
