import {DataContext} from "../utils/DataContext";
import {FlightDataModel} from "../classes/FlightDataModel";
import randomWords from "@thorium/random-words";
import {pubsub} from "../utils/pubsub";
import {thoriumPath} from "../utils/appPaths";
import fs from "fs/promises";

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
    context.flight.pluginIds = plugins;
    // TODO September 1, 2021 - We can uncomment this when the plugin system is done
    // context.flight.activatePlugins(true)
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
