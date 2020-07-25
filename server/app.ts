import randomWords from "random-words";
import getStore from "./helpers/dataStore";
import {appStoreDir, appStorePath} from "./helpers/appPaths";
import Client from "./schema/client";
import Flight from "./schema/flight";
import fs from "fs/promises";
import Entity from "./helpers/ecs/entity";

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
}

const storage = getStore<PersistentStorage>({
  class: PersistentStorage,
  path: appStorePath,
});

class AppClass {
  storage: Writable<PersistentStorage> = storage;
  activeFlight: ActiveFlightT = null;
  plugins!: Plugins;

  httpOnly: boolean = false;
  port: number = process.env.NODE_ENV === "production" ? 4444 : 3001;

  async init() {
    if (process.env.PORT && !isNaN(parseInt(process.env.PORT, 10)))
      this.port = parseInt(process.env.PORT, 10);
    this.httpOnly = process.env.HTTP_ONLY === "true";

    // Load in plugins from the filesystem
    this.plugins = {ships: []};
    try {
      const plugins = await fs.readdir(`${appStoreDir}/ships`);

      for (let plugin of plugins) {
        if ((await fs.lstat(`${appStoreDir}/ships/${plugin}`)).isDirectory()) {
          this.plugins.ships.push(
            getStore<Entity>({
              class: Entity,
              path: `${appStoreDir}/ships/${plugin}/data.json`,
            }),
          );
        }
      }
    } catch {
      // The folder probably didn't exist, which means
      // there are no ships anyway
      await fs.mkdir(`${appStoreDir}/ships`);
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
    this.activeFlight?.writeFile(true);

    let pluginVariety: keyof Plugins;
    for (pluginVariety in this.plugins) {
      this.plugins[pluginVariety].forEach(p => p.writeFile(true));
    }
  }
}

const App = new AppClass();
export default App;
