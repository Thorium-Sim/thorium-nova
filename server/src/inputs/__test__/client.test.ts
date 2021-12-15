import {ServerClient} from "server/src/classes/Client";
import type {ServerDataModel} from "server/src/classes/ServerDataModel";
import {FlightClient} from "server/src/classes/FlightClient";
import {ECS, Entity} from "server/src/utils/ecs";
import {clientInputs} from "../client";
import systems from "../../systems";
import type ShipPlugin from "server/src/classes/Plugins/Ship";
import {FlightDataModel} from "server/src/classes/FlightDataModel";

class MockServerDataModel {
  clients!: Record<string, ServerClient>;
  thoriumId!: string;
  activeFlightName!: string | null;
  plugins = [];
  constructor() {
    this.clients = {
      test: new ServerClient({
        id: "test",
      }),
    };
  }
  toJSON() {
    const {plugins, ...data} = this;
    return data;
  }
}
class MockFlightDataModel {
  static INTERVAL = 1000 / 60;
  id: string = "Test Flight";
  name: string = "Test Flight";
  date: number = Date.now();
  paused: boolean = false;
  ecs!: ECS;
  clients: Record<string, FlightClient> = {};
  pluginIds: string[] = [];
  private initEntities: Entity[] = [];
  serverDataModel: ServerDataModel;
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
  clientId: "test" = "test";
  database: any = {};
  server = new MockServerDataModel() as any as ServerDataModel;
  flight = new MockFlightDataModel({
    serverDataModel: this.server,
    initialLoad: true,
    entities: [],
  }) as any as FlightDataModel;
  constructor() {
    this.flight.initEcs(this.server);
    for (let client in this.server.clients) {
      this.server.clients[client].clientContext = this;
    }
  }
  get client() {
    return this.server.clients[this.clientId];
  }
  get flightClient() {
    return this.findFlightClient(this.clientId);
  }
  findFlightClient(clientId: string) {
    return this.flight.clients[clientId];
  }
  get ship() {
    return this.flight.playerShips[0];
  }
}
describe("Client input", () => {
  it("should assign to a client and station", async () => {
    const mockDataContext = new MockDataContext();
    expect(
      clientInputs.clientSetStation(mockDataContext, {
        shipId: 1,
        stationId: "Test",
      })
    ).rejects.toThrowError("No ship with that ID exists");

    const ship = mockDataContext.flight.ecs.addEntity(
      new Entity(1, {
        isShip: {shipClass: "Test", category: "Test", registry: "", assets: {}},
        isPlayerShip: {value: true},
        stationComplement: {
          stations: [
            {
              name: "Test",
              apiVersion: "stations/v1",
              kind: "stations",
              description: "",
              logo: "",
              theme: "",
              tags: [],
              cards: [],
            },
          ],
        },
      })
    );
    await clientInputs.clientSetStation(mockDataContext, {
      shipId: 1,
      stationId: "Test",
    });
    expect(mockDataContext.flight.clients.test.stationId).toBe("Test");
  });
});
