import {DataContext} from "../utils/DataContext";
import {FlightDataModel} from "../classes/FlightDataModel";
import randomWords from "@thorium/random-words";
import getStore, {StoreObject} from "@thorium/db-fs";
import {pubsub} from "../utils/pubsub";
import {thoriumPath} from "../utils/appPaths";
import fs from "fs/promises";

function isWritableFlight(
  flight: any
): flight is FlightDataModel & StoreObject {
  return !!flight?.writeFile;
}

export const flightInputs = {
  flightStart: (
    context: DataContext,
    {
      flightName,
      plugins,
    }: // simulators,
    {
      flightName: string;
      plugins: string[];
      // simulators: FlightStartSimulator[];
    }
  ) => {
    if (context.flight) return context.flight;

    flightName = flightName || randomWords(3).join("-");
    context.flight = getStore<
      Partial<FlightDataModel> & {initialLoad?: boolean}
    >({
      class: FlightDataModel,
      path: `/flights/${flightName}.flight`,
      initialData: {name: flightName, initialLoad: true},
    }) as unknown as FlightDataModel;
    context.flight.initEcs(context.server);
    context.flight.pluginIds = plugins;
    // TODO September 1, 2021 - We can uncomment this when the plugin system is done
    // context.flight.activatePlugins(true)
    pubsub.publish("flight");
    return context.flight.serialize();
  },
  flightPause(context: DataContext) {
    if (context.flight) {
      context.flight.paused = true;
    }
    pubsub.publish("flight");
    return context.flight?.serialize();
  },
  flightResume(context: DataContext) {
    if (context.flight) {
      context.flight.paused = false;
    }
    pubsub.publish("flight");
    return context.flight?.serialize();
  },
  flightReset(context: DataContext) {
    context.flight?.reset();
    pubsub.publish("flight");
    return context.flight?.serialize();
  },
  flightStop(context: DataContext): null {
    // Save the flight, but don't delete it.
    if (!context.flight) return null;
    context.flight.paused = false;
    if (isWritableFlight(context.flight)) {
      context.flight.writeFile();
    }

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
      await fs.unlink(`${thoriumPath}flights/${flightName}.flight`);
    } catch {
      // Do nothing; the file probably didn't exist.
    }
    pubsub.publish("flight");
    pubsub.publish("flights");
    return null;
  },
};
