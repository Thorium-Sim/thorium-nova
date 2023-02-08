import "./init/polyfill";
import {setBasePath} from "@thorium/db-fs";
import buildHTTPServer from "./init/httpServer";
import path from "path";
import {promises as fs, existsSync} from "fs";
import {unzip} from "./utils/unzipFolder";
import {liveQueryPlugin} from "@thorium/live-query/adapters/fastify-adapter";
import {rootPath, thoriumPath} from "./utils/appPaths";
import {buildDatabase} from "./init/buildDatabase";
import {createContext, createWSContext} from "./init/liveQuery";
import {router} from "./init/router";
import {startServer} from "./init/startServer";

setBasePath(thoriumPath);
const isHeadless = !process.env.FORK;

export async function init() {
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

  const database = buildDatabase();
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
}

init();
