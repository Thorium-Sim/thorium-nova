import {ECS, Entity} from "server/src/utils/ecs";
import uniqid from "@thorium/uniqid";
import randomWords from "@thorium/random-words";
import {ServerDataModel} from "./ServerDataModel";
import systems from "../systems";
import {FlightClient} from "./Client";

export class FlightDataModel {
  static INTERVAL = 1000 / 60;
  id: string;
  name: string;
  date: number;
  paused: boolean;
  ecs!: ECS;
  clients: Record<string, FlightClient> = {};
  pluginIds: string[] = [];
  private initEntities: Entity[];
  serverDataModel: ServerDataModel;
  constructor(
    params: Partial<FlightDataModel> & {
      serverDataModel: ServerDataModel;
      initialLoad?: boolean;
      entities: Entity[];
    }
  ) {
    this.id = params.id || uniqid("fli-");
    this.name = params.name || randomWords(3).join("-");
    this.paused = params.paused ?? true;
    this.date = Number(params.date ? new Date(params.date) : new Date());
    this.pluginIds = params.pluginIds || [];
    this.serverDataModel = params.serverDataModel;
    this.initEntities = params.entities || [];
    this.clients = Object.fromEntries(
      Object.entries(params.clients || {}).map(([id, client]) => [
        id,
        new FlightClient(client),
      ])
    );
  }
  run = () => {
    // Run all the systems
    if (!this.paused) {
      this.ecs.update();
    }
    if (process.env.NODE_ENV === "test") return;
    setTimeout(this.run, FlightDataModel.INTERVAL);
  };
  initEcs(server: ServerDataModel) {
    this.ecs = new ECS(server);
    systems.forEach(Sys => {
      this.ecs.addSystem(new Sys());
    });
    this.initEntities.forEach(({id, components}) => {
      const e = new Entity(id, components);
      this.ecs.addEntity(e);
    });
    this.run();
  }
  reset() {
    // TODO: Flight Reset Handling
  }

  // TODO September 1, 2021 - We can uncomment this when the plugin system is done
  // activatePlugins(initialLoad?: boolean): void {
  //   this.pluginIds.forEach(pluginId => {
  //     const plugin = getPlugin(pluginId);
  //     if (initialLoad) {
  //       // TODO: Combine remix plugins with the base plugins.
  //       // Create entities for the universe objects
  //       plugin.universe.forEach(universeItem => {
  //         this.ecs.addEntity(
  //           new Entity({...universeItem, pluginId: plugin.id})
  //         );
  //       });
  //     }
  //   });
  // }
  // Helper Getters
  /**
   * All player ships in the universe.
   */
  get playerShips() {
    return this.ecs.entities.filter(
      f => f.components.isShip && f.components.isPlayerShip
    );
  }
  /**
   * All ships in the universe.
   */
  get ships() {
    return this.ecs.entities.filter(f => f.components.isShip);
  }
  /**
   * Ships that are available for spawning in the universe, based on the flight's plugins.
   */
  // TODO September 1, 2021 - We can uncomment this when the plugin system is done
  // get availableShips() {
  //   const allShips = this.pluginIds.reduce((prev: Entity[], next) => {
  //     const plugin = this.serverDataModel.plugins.find(
  //       plugin => plugin.id === next
  //     );
  //     if (!plugin) return prev;
  //     return prev.concat(plugin.ships);
  //   }, []);
  //   return allShips;
  // }
  serialize() {
    // Get all of the entities in the world and serialize them into objects
    return {
      id: this.id,
      name: this.name,
      paused: this.paused,
      date: this.date,
      pluginIds: this.pluginIds,
      entities: this.ecs.entities.map(e => e.serialize()),
      flightClients: Object.fromEntries(
        Object.entries(this.clients).map(([id, client]) => [
          id,
          client.serialize(),
        ])
      ),
    };
  }
}
