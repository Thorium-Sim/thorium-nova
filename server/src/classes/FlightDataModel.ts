import {ECS, Entity} from "server/src/utils/ecs";
import randomWords from "@thorium/random-words";
import {ServerDataModel} from "./ServerDataModel";
import systems from "../systems";
import {FlightClient} from "./FlightClient";
import {FSDataStore, FSDataStoreOptions} from "@thorium/db-fs";
import ShipPlugin from "./Plugins/Ship";
import {DefaultUIDGenerator} from "../utils/ecs/uid";
import {InventoryTemplate} from "./Plugins/Inventory";

export class FlightDataModel extends FSDataStore {
  static INTERVAL = 1000 / 60;
  name!: string;
  date!: number;
  paused!: boolean;
  ecs!: ECS;
  clients!: Record<string, FlightClient>;
  pluginIds!: string[];
  private entities!: Entity[];
  inventoryTemplates!: {[inventoryTemplateName: string]: InventoryTemplate};
  serverDataModel: ServerDataModel;
  interval!: ReturnType<typeof setInterval>;
  constructor(
    params: Partial<FlightDataModel> & {
      serverDataModel: ServerDataModel;
      initialLoad?: boolean;
      entities: Entity[];
    },
    storeOptions: FSDataStoreOptions = {}
  ) {
    const flightName = params.name || randomWords(3).join("-");

    super(
      {
        name: flightName,
        paused: false,
        date: Number(params.date ? new Date(params.date) : new Date()),
      },
      storeOptions
    );
    this.name ??= flightName;
    this.paused ??= params.paused ?? true;
    this.date ??= Number(params.date ? new Date(params.date) : new Date());
    this.pluginIds ??= params.pluginIds || [];
    this.serverDataModel = params.serverDataModel;
    this.entities ??= params.entities || [];

    this.clients = Object.fromEntries(
      Object.entries(this.clients || params.clients || {}).map(
        ([id, client]) => [id, new FlightClient(client)]
      )
    );

    this.inventoryTemplates = Object.fromEntries(
      Object.entries(
        this.inventoryTemplates || params.inventoryTemplates || {}
      ).map(([key, val]) => [key, new InventoryTemplate(val)])
    );
  }
  run = () => {
    // Run all the systems
    if (!this.paused) {
      this.ecs.update();
    }
    if (process.env.NODE_ENV === "test") return;
    this.interval = setTimeout(this.run, FlightDataModel.INTERVAL);
  };
  destroy() {
    clearInterval(this.interval);

    this.ecs.entities.forEach(entity => {
      entity.dispose();
    });
  }
  initEcs(server: ServerDataModel) {
    this.ecs = new ECS(server);
    systems.forEach(Sys => {
      this.ecs.addSystem(new Sys());
    });
    this.entities.forEach(({id, components}) => {
      const e = new Entity(id, components);
      this.ecs.addEntity(e);
      DefaultUIDGenerator.uid = Math.max(DefaultUIDGenerator.uid, id);
    });
    this.run();
  }
  reset() {
    // TODO: Flight Reset Handling
  }

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
  get availableShips() {
    const allShips = this.pluginIds.reduce((prev: ShipPlugin[], next) => {
      const plugin = this.serverDataModel.plugins.find(
        plugin => plugin.id === next
      );
      if (!plugin) return prev;
      return prev.concat(plugin.aspects.ships);
    }, []);
    return allShips;
  }
  toJSON() {
    // Get all of the entities in the world and serialize them into objects
    const data = {
      name: this.name,
      paused: this.paused,
      date: this.date,
      pluginIds: this.pluginIds,
      entities: this.ecs.entities.map(e => e.toJSON()),
      maxEntityId: this.ecs.maxEntityId,
      clients: Object.fromEntries(
        Object.entries(this.clients).map(([id, client]) => [id, client])
      ),
      inventoryTemplates: this.inventoryTemplates,
    };
    return data;
  }
}
