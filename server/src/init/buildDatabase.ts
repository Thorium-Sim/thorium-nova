import {ServerDataModel} from "../classes/ServerDataModel";
import {databaseName} from "../utils/appPaths";
import randomWords from "@thorium/random-words";
import {FlightDataModel} from "../classes/FlightDataModel";

export let database: {
  server: ServerDataModel;
  flight: FlightDataModel | null;
};
export async function buildDatabase() {
  // Create the primary database
  // This is for any user data that is persisted between flights
  // but that isn't part of a plugin. Not much goes in here.
  const serverModel = new ServerDataModel(
    {thoriumId: randomWords(3).join("-"), activeFlightName: null},
    {path: databaseName}
  );

  // Wait for the plugins to load. Shouldn't take long.
  await new Promise<void>(res => {
    const interval = setInterval(() => {
      if (serverModel.plugins.length > 0) {
        clearInterval(interval);
        res();
      }
    }, 100);
  });

  // If a flight is in progress, load it.
  // This helps in situations where the server is shut
  // down or crashes unexpectedly.
  let flight = null;
  if (serverModel.activeFlightName) {
    const flightName = serverModel.activeFlightName;
    flight = new FlightDataModel(
      {
        name: flightName,
        initialLoad: false,
        entities: [],
        serverDataModel: serverModel,
      },
      {path: `/flights/${flightName}.flight`}
    );
    await flight.initEcs(serverModel);
  }

  database = {server: serverModel, flight};

  return database;
}
