import randomWords from "random-words";
import getStore from "./helpers/dataStore";
import {appStoreDir, appStorePath} from "./helpers/appPaths";
import Client from "./schema/client";
import Flight from "./schema/flight";
import fs from "fs/promises";
import {Writable} from "./helpers/writable";
import BasePlugin from "./schema/plugins/basePlugin";
import setupBonjour from "./startup/bonjour";
import type bonjour from "bonjour";
import type {Express} from "express";
import type {ApolloServer} from "apollo-server-express";
import type {Server} from "http";
import setupHttpServer from "./startup/httpServer";
import setupUDP from "./startup/udp";
import {GraphQLSchema} from "graphql";

type ActiveFlightT = Writable<Flight> | null;

class PersistentStorage {
  clients: Client[];
  thoriumId: string;
  activeFlightName: string | null;
  constructor(params: Partial<PersistentStorage> = {}) {
    this.clients = params.clients?.map(c => new Client(c)) || [];
    this.thoriumId = params.thoriumId || randomWords(5).join("-");
    this.activeFlightName = params.activeFlightName || null;
  }
}

export function isWritableFlight(flight: any): flight is ActiveFlightT {
  return !!flight?.writeFile;
}

const storage = getStore<PersistentStorage>({
  class: PersistentStorage,
  path: appStorePath,
});

class AppClass {
  storage: Writable<PersistentStorage> = storage;
  activeFlight: Flight | ActiveFlightT = null;
  plugins!: BasePlugin[];

  // Server Stuff
  httpOnly: boolean = false;
  port: number = process.env.NODE_ENV === "production" ? 4444 : 3001;

  bonjour: bonjour.Service | null = null;
  schema?: GraphQLSchema;
  servers: {
    express?: Express;
    apollo?: ApolloServer;
    httpServer?: Server;
  } = {};

  constructor() {
    this.plugins = [];
    if (process.env.PORT && !isNaN(parseInt(process.env.PORT, 10)))
      this.port = parseInt(process.env.PORT, 10);
    this.httpOnly = process.env.HTTP_ONLY === "true";
  }
  async init() {
    // Load in plugins from the filesystem
    try {
      const plugins = await fs.readdir(`${appStoreDir}plugins`);
      for (let plugin of plugins) {
        if ((await fs.lstat(`${appStoreDir}plugins/${plugin}`)).isDirectory()) {
          this.plugins.push(
            getStore<BasePlugin>({
              class: BasePlugin,
              path: `${appStoreDir}plugins/${plugin}/plugin.json`,
            })
          );
        }
      }
    } catch (Err) {
      // The folder probably didn't exist, which means
      // there are no plugins anyway
      try {
        await fs.mkdir(`${appStoreDir}plugins`);
      } catch (err) {}
    }

    // Load the active flight, if applicable
    if (this.storage.activeFlightName) {
      try {
        await fs.access(
          `${appStoreDir}flights/${this.storage.activeFlightName}.flight`
        );
        App.activeFlight = getStore<Flight>({
          class: Flight,
          path: `${appStoreDir}flights/${this.storage.activeFlightName}.flight`,
        });
        this.startBonjour();
      } catch {
        // Do nothing - trying to access failed, so we just won't load a flight
      }
    }
  }
  async startHttpServer() {
    if (!this.servers.express || !this.servers.apollo || !this.schema) return;
    this.servers.httpServer = await setupHttpServer(
      this.servers.express,
      this.servers.apollo,
      this.schema,
      this.port,
      this.httpOnly
    );
    setupUDP(this, this.servers.httpServer);
    return this.servers.httpServer;
  }
  stopHttpServer() {
    this.servers.httpServer?.close();
    this.servers.httpServer = undefined;
  }
  startBonjour() {
    if (this.bonjour) return;
    const {service} = setupBonjour(this.port, this.httpOnly);
    this.bonjour = service;
  }
  stopBonjour() {
    this.bonjour?.stop();
    this.bonjour = null;
  }
  /* istanbul ignore next */
  snapshot() {
    this.storage.writeFile(true);
    if (isWritableFlight(this.activeFlight)) {
      this.activeFlight?.writeFile(true);
    }

    for (let plugin of this.plugins) {
      plugin.save();
    }
  }
}

const App = new AppClass();
export default App;
