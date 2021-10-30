import createStore, {setBasePath, StoreObject} from "@thorium/db-fs";
import {databaseName, thoriumPath} from "./utils/appPaths";
import buildHTTPServer from "./init/httpServer";
import path from "path";
import {setUpAPI} from "./init/setUpAPI";
import {ServerDataModel} from "./classes/ServerDataModel";
import randomWords from "@thorium/random-words";
import {applyDataChannel} from "./init/dataChannel";
import chalk from "chalk";
import getStore from "@thorium/db-fs";
import {FlightDataModel} from "./classes/FlightDataModel";

setBasePath(thoriumPath);

const isHeadless = !process.env.FORK;

export async function startServer() {
  // Create the primary database
  // This is for any user data that is persisted between flights
  // but that isn't part of a plugin. Not much goes in here.
  const serverModel = createStore<ServerDataModel>({
    path: databaseName,
    class: ServerDataModel,
    initialData: {
      clients: {},
      thoriumId: randomWords(3).join("-"),
      activeFlightName: null,
      plugins: [],
    },
    serialize: ({clients, ...data}) => ({
      ...data,
      // We don't want to serialize and store the Geckos channels, so we remove
      // them from the clients.
      clients: Object.fromEntries(
        Object.entries(clients).map(([clientId, client]) => {
          return [clientId, client.serialize()];
        })
      ),
    }),
  });

  // If a flight is in progress, load it.
  // This helps in situations where the server is shut
  // down or crashes unexpectedly.
  let flight = null;
  if (serverModel.activeFlightName) {
    const flightName = serverModel.activeFlightName;
    flight = getStore<Partial<FlightDataModel> & {initialLoad?: boolean}>({
      class: FlightDataModel,
      path: `/flights/${flightName}.flight`,
      initialData: {name: flightName, initialLoad: true},
    }) as unknown as FlightDataModel;
  }

  const database = {server: serverModel, flight};

  if (isHeadless) {
    // Start the headless HTTP server. Most of the time, Thorium Clients
    // aren't running HTTP servers unless they are running a flight.
    // However, headless servers will always eventually run a flight,
    // so there's no reason not to start the HTTP server right away.

    const app = buildHTTPServer({
      isHeadless,
      staticRoot: path.join(process.cwd(), "public/"),
    });
    const UDP_START = parseInt(process.env.UDP_START || "50000", 10);
    const UDP_RANGE = parseInt(process.env.UDP_RANGE || "200", 10);
    await applyDataChannel(app, database, UDP_START, UDP_START + UDP_RANGE);
    setUpAPI(app, database);
    const PORT =
      process.env.PORT || (process.env.NODE_ENV === "production" ? 4444 : 3001);
    try {
      await app.listen(PORT, "0.0.0.0");
      console.info(chalk.greenBright(`Access app at http://localhost:${PORT}`));
      console.info(
        chalk.cyan(`Doing port forwarding? Open these ports in your router:`)
      );
      console.info(chalk.cyan(`  - TCP ${PORT} for web app access`));
      console.info(
        chalk.cyan(
          `  - UDP ${UDP_START} - ${Math.min(
            UDP_START + UDP_RANGE,
            Math.pow(2, 16) - 1
          )} for realtime connections`
        )
      );
    } catch (err) {
      console.error(err);
      app.log.error(err);
    }
  }
}

startServer();
