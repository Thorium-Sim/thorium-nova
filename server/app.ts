import randomWords from "random-words";
import getStore from "./helpers/dataStore";
import {appStoreDir, appStorePath} from "./helpers/appPaths";
import Client from "./schema/client";
import Flight from "./schema/flight";
import fs from "fs/promises";
import Entity from "./helpers/ecs/entity";
import StationComplement from "./schema/stationComplement";

type Writable<T> = T & {
  writeFile: (force?: boolean) => Promise<void>;
};
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

interface Plugins {
  ships: Writable<Entity>[];
  stationComplements: Writable<StationComplement>[];
}

const pluginClassMap = {
  ships: Entity,
  stationComplements: StationComplement,
};

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
  plugins!: Plugins;

  httpOnly: boolean = false;
  port: number = process.env.NODE_ENV === "production" ? 4444 : 3001;

  constructor() {
    this.plugins = {ships: [], stationComplements: []};
    if (process.env.PORT && !isNaN(parseInt(process.env.PORT, 10)))
      this.port = parseInt(process.env.PORT, 10);
    this.httpOnly = process.env.HTTP_ONLY === "true";
  }
  async init() {
    // Load in plugins from the filesystem
    let pluginVariety: keyof Plugins;

    for (pluginVariety in this.plugins) {
      try {
        const plugins = await fs.readdir(`${appStoreDir}/${pluginVariety}`);

        for (let plugin of plugins) {
          if (
            (
              await fs.lstat(`${appStoreDir}/${pluginVariety}/${plugin}`)
            ).isDirectory()
          ) {
            this.plugins[pluginVariety].push(
              getStore<any>({
                class: pluginClassMap[pluginVariety],
                path: `${appStoreDir}/${pluginVariety}/${plugin}/data.json`,
              }),
            );
          }
        }
      } catch {
        // The folder probably didn't exist, which means
        // there are no ships anyway
        await fs.mkdir(`${appStoreDir}/${pluginVariety}`);
      }
    }

    // Load the active flight, if applicable
    if (this.storage.activeFlightName) {
      try {
        await fs.access(
          `${appStoreDir}/flights/${this.storage.activeFlightName}.flight`,
        );
        App.activeFlight = getStore<Flight>({
          class: Flight,
          path: `${appStoreDir}/flights/${this.storage.activeFlightName}.flight`,
        });
      } catch {
        // Do nothing - trying to access failed, so we just won't load a flight
      }
    }
  }
  snapshot() {
    this.storage.writeFile(true);
    if (isWritableFlight(this.activeFlight)) {
      this.activeFlight?.writeFile(true);
    }

    let pluginVariety: keyof Plugins;
    for (pluginVariety in this.plugins) {
      this.plugins[pluginVariety].forEach((p: Writable<{}>) =>
        p.writeFile(true),
      );
    }
  }
}

const App = new AppClass();
export default App;
