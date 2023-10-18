import {ECS, Entity} from "server/src/utils/ecs";
import randomWords from "@thorium/random-words";
import {ServerDataModel} from "./ServerDataModel";
import systems from "../systems";
import {FlightClient} from "./FlightClient";
import {FSDataStore, FSDataStoreOptions} from "@thorium/db-fs";
import ShipPlugin from "./Plugins/Ship";
import {DefaultUIDGenerator} from "../utils/ecs/uid";
import RAPIER, {World} from "@dimforge/rapier3d-compat";
import path from "path";
import {thoriumPath} from "@server/utils/appPaths";

export class FlightDataModel extends FSDataStore {
  static INTERVAL = 1000 / 60;
  name!: string;
  date!: number;
  paused!: boolean;
  ecs!: ECS;
  clients!: Record<string, FlightClient>;
  pluginIds!: string[];
  private entities!: Entity[];
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
    const data = this.getData();
    this.name ??= flightName;
    this.paused ??= data.paused ?? true;
    this.date ??= Number(data.date ? new Date(data.date) : new Date());
    this.pluginIds ??= data.pluginIds || [];
    this.serverDataModel = params.serverDataModel;
    this.entities ??= data.entities || [];

    this.clients = Object.fromEntries(
      Object.entries(this.clients || data.clients || {}).map(([id, client]) => [
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
    this.interval = setTimeout(this.run, FlightDataModel.INTERVAL);
  };
  destroy() {
    clearInterval(this.interval);

    this.ecs.entities.forEach(entity => {
      entity.dispose();
    });
  }
  async initEcs(server: ServerDataModel) {
    this.ecs = new ECS(server);
    systems.forEach(Sys => {
      this.ecs.addSystem(new Sys());
    });
    // We need to selectively add certain entities first
    this.entities.forEach(({id, components}) => {
      if (components.isSolarSystem) {
        const e = new Entity(id, components);
        this.ecs.addEntity(e);
      }
    });
    this.entities.forEach(({id, components}) => {
      if (components.isSolarSystem) return;
      const e = new Entity(id, components);
      this.ecs.addEntity(e);
    });
    const maxId = this.entities.reduce(
      (acc, {id}) => Math.max(acc, id),
      DefaultUIDGenerator.uid
    );
    DefaultUIDGenerator.uid = maxId + 1;
    this.run();
  }
  async initPhysics() {
    // Fetch and calculate all of the colliders for the ships in the plugins
    // Loop over every ship in every loaded plugin
    let ships: ShipPlugin[] = [];
    for (let plugin of this.serverDataModel.plugins) {
      if (!this.pluginIds.includes(plugin.id)) continue;
      for (let ship of plugin.aspects.ships) {
        ships.push(ship);
      }
    }
    await Promise.all(
      ships.map(async ship => {
        const colliderDesc = await generateColliderDesc(
          path.join(thoriumPath, ship.assets.model),
          ship.mass
        );
        if (!colliderDesc) return;
        this.ecs.colliderCache.set(ship.assets.model, colliderDesc);
      })
    );
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
    };
    return data;
  }
}

async function generateColliderDesc(filePath: string, mass: number) {
  const ConvexHull = await import("three-stdlib").then(res => res.ConvexHull);
  const loadGltf = await import("node-three-gltf").then(res => res.loadGltf);

  const gltf = await loadGltf(filePath);
  const hull = new ConvexHull();
  hull.setFromObject(gltf.scene.children[0]);

  const vertices = [];
  for (let vertex of hull.vertices) {
    vertices.push(vertex.point.x, vertex.point.y, vertex.point.z);
  }
  const verticesFloat32 = new Float32Array(vertices);
  const colliderDesc =
    RAPIER.ColliderDesc.convexHull(verticesFloat32)?.setMass(mass);
  return colliderDesc;
}
