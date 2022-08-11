import {setBasePath} from "@thorium/db-fs";
import {databaseName, thoriumPath, rootPath} from "./utils/appPaths";
import buildHTTPServer from "./init/httpServer";
import path from "path";
import {setUpAPI} from "./init/setUpAPI";
import {ServerDataModel} from "./classes/ServerDataModel";
import randomWords from "@thorium/random-words";
import {applyDataChannel} from "./init/dataChannel";
import chalk from "chalk";
import {FlightDataModel} from "./classes/FlightDataModel";
import {promises as fs, existsSync} from "fs";
import {unzip} from "./utils/unzipFolder";
import {buildHttpsProxy} from "./init/httpsProxy";
import fastify from "fastify";
setBasePath(thoriumPath);
const isHeadless = !process.env.FORK;

export async function startServer() {
  // Initialize the database if it doesn't exist
  if (!existsSync(thoriumPath)) {
    await fs.mkdir(thoriumPath, {recursive: true});
    await fs.mkdir(path.join(thoriumPath, "plugins"), {recursive: true});
    // Initialize the default plugin
    await unzip(
      path.join(rootPath, isHeadless ? "./" : "../../app", "defaultPlugin.zip"),
      path.join(thoriumPath, "plugins/")
    );
  }

  // Create the primary database
  // This is for any user data that is persisted between flights
  // but that isn't part of a plugin. Not much goes in here.
  const serverModel = new ServerDataModel(
    {thoriumId: randomWords(3).join("-"), activeFlightName: null},
    {path: databaseName}
  );

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
    flight.initEcs(serverModel);
  }

  const database = {server: serverModel, flight};

  const app = await buildHTTPServer({
    staticRoot: path.join(rootPath, "public/"),
  });
  await applyDataChannel(app, database);
  setUpAPI(app, database);
  const PORT =
    Number(process.env.PORT) ||
    (process.env.NODE_ENV === "production" ? 4444 : 3001);
  const HTTPSPort = PORT + 1;
  const proxy = buildHttpsProxy(PORT);

  try {
    await app.listen({port: PORT});
    if (process.env.NODE_ENV === "production") {
      await proxy.listen({port: HTTPSPort});
    }
    console.info(chalk.greenBright(`Access app at http://localhost:${PORT}`));
    console.info(
      chalk.cyan(`Doing port forwarding? Open this port in your router:`)
    );
    console.info(chalk.cyan(`  - TCP ${PORT} for web app access`));
    console.info(chalk.cyan(`  - TCP ${HTTPSPort} for HTTPS access`));
    process.send?.("ready");
  } catch (err) {
    process.send?.("error");
    console.error(err);
    app.log.error(err);
  }
}

export const viteNodeApp = startServer();
