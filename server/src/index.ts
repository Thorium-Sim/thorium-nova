import "./init/polyfill";
import {setBasePath} from "@thorium/db-fs";
import buildHTTPServer from "./init/httpServer";
import path from "path";
import {existsSync} from "fs";
import {liveQueryPlugin} from "@thorium/live-query/adapters/fastify-adapter";
import {rootPath, thoriumPath} from "./utils/appPaths";
import {buildDatabase} from "./init/buildDatabase";
import {createContext, createWSContext} from "./init/liveQuery";
import {router} from "./init/router";
import {startServer} from "./init/startServer";
import {exitHandler} from "./init/exitHandler";
import {initDefaultPlugin} from "./init/initDefaultPlugin";

setBasePath(thoriumPath);

export async function init() {
  // Initialize the database if it doesn't exist
  if (!existsSync(thoriumPath)) {
    await initDefaultPlugin();
  }

  const database = await buildDatabase();
  const app = await buildHTTPServer({
    staticRoot: path.join(rootPath, "public/"),
  });
  await app.register(liveQueryPlugin, {
    createContext: createContext as any,
    createWSContext: createWSContext as any,
    router,
    extraContext: database,
  });

  await startServer(app);

  exitHandler(database);
}

init();
