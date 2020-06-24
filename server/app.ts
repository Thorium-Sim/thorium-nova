import randomWords from "random-words";
import getStore from "./helpers/dataStore";
import {appStorePath} from "./helpers/appPaths";
import Client from "./schema/client";
import Flight from "./schema/flight";

class PersistentStorage {
  clients: Client[] = [];
  thoriumId: string = randomWords(5).join("-");
}

const storage = getStore<PersistentStorage>({
  class: PersistentStorage,
  path: appStorePath,
});

class AppClass {
  storage: PersistentStorage = storage;
  activeFlight: Flight | null = null;

  httpOnly: boolean = false;
  port: number = process.env.NODE_ENV === "production" ? 4444 : 3001;

  init() {
    if (process.env.PORT && !isNaN(parseInt(process.env.PORT, 10)))
      this.port = parseInt(process.env.PORT, 10);
    this.httpOnly = process.env.HTTP_ONLY === "true";
  }
}

const App = new AppClass();
export default App;
