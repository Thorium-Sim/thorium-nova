import type {InventoryFlags} from "@server/classes/Plugins/Inventory/InventoryFlags";
import {Client} from "@server/init/liveQuery";
import {pubsub} from "@server/init/pubsub";
import {router} from "@server/init/router";
import {FlightClient} from "../classes/FlightClient";
import type {FlightDataModel} from "../classes/FlightDataModel";
import type BasePlugin from "../classes/Plugins";
import ShipPlugin from "../classes/Plugins/Ship";
import type {ServerDataModel} from "../classes/ServerDataModel";
import systems from "../systems";
import type {DataContext} from "./DataContext";
import {ECS, Entity} from "./ecs";

class MockServerDataModel {
  clients!: Record<string, Client<any>>;
  thoriumId!: string;
  activeFlightName!: string | null;
  plugins = [
    {
      id: "Test Plugin",
      name: "Test Plugin",
      active: true,
      aspects: {
        shipSystems: [],
        ships: [
          new ShipPlugin({name: "Test Template"}, {
            name: "Test Plugin",
            aspects: {ships: []},
          } as unknown as BasePlugin),
        ],
        solarSystems: [],
        inventory: [],
      },
    },
  ];
  constructor() {
    this.clients = {
      test: new Client("test", router, pubsub),
    };
  }
  toJSON() {
    const {plugins, ...data} = this;
    return data;
  }
}
class MockFlightDataModel {
  static INTERVAL = 1000 / 60;
  id = "Test Flight";
  name = "Test Flight";
  date: number = Date.now();
  paused = false;
  ecs!: ECS;
  clients: Record<string, FlightClient> = {};
  pluginIds: string[] = [];
  private initEntities: Entity[] = [];
  serverDataModel: ServerDataModel;
  inventoryTemplates: {
    [key: string]: {
      name: string;
      volume: number;
      abundance: number;
      flags: InventoryFlags;
    };
  } = {};
  constructor(
    params: Partial<MockFlightDataModel> & {
      serverDataModel: ServerDataModel;
      initialLoad?: boolean;
      entities: Entity[];
    }
  ) {
    this.serverDataModel = params.serverDataModel;
    this.initEntities = params.entities || [];
    this.clients = {
      test: new FlightClient({
        id: "test",
        flightId: this.id,
      }),
    };
  }
  run = () => {
    // Run all the systems
    if (!this.paused) {
      this.ecs.update();
    }
    if (process.env.NODE_ENV === "test") return;
    setTimeout(this.run, MockFlightDataModel.INTERVAL);
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
  get playerShips() {
    return this.ecs.entities.filter(
      f => f.components.isShip && f.components.isPlayerShip
    );
  }
  get ships() {
    return this.ecs.entities.filter(f => f.components.isShip);
  }
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
    return {
      id: this.id,
      name: this.name,
      paused: this.paused,
      date: this.date,
      pluginIds: this.pluginIds,
      entities: this.ecs.entities,
      flightClients: Object.fromEntries(
        Object.entries(this.clients).map(([id, client]) => [id, client])
      ),
    };
  }
}
class MockDataContext {
  id = "test" as const;
  database: {server: ServerDataModel; flight: FlightDataModel | null} = {
    server: new MockServerDataModel() as any as ServerDataModel,
    flight: null,
  };
  constructor() {
    this.database.flight = new MockFlightDataModel({
      serverDataModel: this.database.server,
      initialLoad: true,
      entities: [],
    }) as any as FlightDataModel;
    this.flight?.initEcs(this.server);
  }
  get flight() {
    return this.database.flight;
  }
  set flight(flight: FlightDataModel | null) {
    this.database.flight = flight;
  }
  get server() {
    return this.database.server;
  }
  get client() {
    return this.server.clients[this.id];
  }
  get flightClient() {
    return this.findFlightClient(this.id);
  }
  findFlightClient(clientId: string) {
    return this.flight?.clients[clientId] || null;
  }
  get ship() {
    return this.flight?.playerShips[0];
  }
  get isHost() {
    return true;
  }
}

export function createMockDataContext() {
  return new MockDataContext();
}

export function createMockRouter(context: DataContext) {
  return router.createCaller(context);
}
