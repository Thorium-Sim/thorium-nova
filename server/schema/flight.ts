import {
  Field,
  ID,
  Resolver,
  Query,
  Arg,
  Mutation,
  ObjectType,
  Ctx,
  InputType,
  Subscription,
} from "type-graphql";
import uuid from "uniqid";
import randomWords from "random-words";
import fs from "fs/promises";

import App, {isWritableFlight} from "../app";
import ECS from "../helpers/ecs/ecs";
import Entity from "../helpers/ecs/entity";
import getStore from "../helpers/dataStore";
import {appStoreDir} from "../helpers/appPaths";
import {TimerSystem} from "../systems/TimerSystem";
import {GraphQLContext} from "../helpers/graphqlContext";
import {AutoRotateSystem} from "server/systems/AutoRotateSystem";
import {AutoThrustSystem} from "server/systems/AutoThrustSystem";
import {ThrusterSystem} from "server/systems/ThrusterSystem";
import {RotationSystem} from "server/systems/RotationSystem";
import {ImpulseSystem} from "server/systems/ImpulseSystem";
import {WarpSystem} from "server/systems/WarpSystem";
import {WarpVelocityPosition} from "server/systems/WarpVelocityPosition";
import {EngineVelocitySystem} from "server/systems/EngineVelocitySystem";
import {PositionVelocitySystem} from "server/systems/PositionVelocitySystem";
import {getPlugin} from "./plugins/basePlugin";
import {Networking} from "server/systems/Networking";
import {shipSpawn} from "./activeFlight/ships";
import {getOrbitPosition} from "server/helpers/getOrbitPosition";
import {pubsub} from "server/helpers/pubsub";
import {Vector3} from "three";
import {createStationComplement} from "server/helpers/createStationComplement";
import {StationComplementComponent} from "server/components/stationComplement";

const INTERVAL = 1000 / 60;

@ObjectType()
export default class Flight {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  paused: boolean;

  @Field()
  date: Date;

  pluginIds: string[] = [];

  ecs = new ECS();
  constructor(
    params: Partial<{
      id: string;
      name: string;
      paused: boolean;
      date: Date;
      pluginIds: string[];
      entities: Partial<Entity>[];
    }> = {}
  ) {
    this.id = params.id || uuid();
    this.name = params.name || randomWords(3).join("-");
    this.paused = params.paused ?? true;
    this.date = params.date ? new Date(params.date) : new Date();
    this.pluginIds = params.pluginIds || [];
    this.activatePlugins();

    params.entities?.forEach(f => {
      const e = new Entity({...f});
      this.ecs.addEntity(e);
    });

    this.ecs.addSystem(new TimerSystem());
    this.ecs.addSystem(new AutoRotateSystem());
    this.ecs.addSystem(new AutoThrustSystem());
    this.ecs.addSystem(new ThrusterSystem());
    this.ecs.addSystem(new ImpulseSystem());
    this.ecs.addSystem(new WarpSystem());
    this.ecs.addSystem(new RotationSystem());
    this.ecs.addSystem(new EngineVelocitySystem());
    this.ecs.addSystem(new WarpVelocityPosition());
    this.ecs.addSystem(new PositionVelocitySystem());
    this.ecs.addSystem(new Networking());

    this.run();
  }
  run = () => {
    // Run all the systems
    if (!this.paused) {
      this.ecs.update();
    }
    if (process.env.NODE_ENV === "test") return;
    setTimeout(this.run, INTERVAL);
  };
  setPaused(tf: boolean) {
    this.paused = tf;
    if (!tf) {
      this.run();
    }
  }
  reset() {
    // TODO: Flight Reset Handling
  }

  activatePlugins(initialLoad?: boolean): void {
    this.pluginIds.forEach(pluginId => {
      const plugin = getPlugin(pluginId);
      if (initialLoad) {
        // TODO: Combine remix plugins with the base plugins.
        // Create entities for the universe objects
        plugin.universe.forEach(universeItem => {
          App.activeFlight?.ecs.addEntity(
            new Entity({...universeItem, pluginId: plugin.id})
          );
        });
      }
    });
  }

  @Field(type => [Entity])
  get playerShips() {
    return this.ecs.entities.filter(
      f => f.components.isShip && f.components.isPlayerShip
    );
  }
  get ships() {
    return this.ecs.entities.filter(f => f.components.isShip);
  }
  @Field(type => [Entity])
  get availableShips() {
    const allShips = this.pluginIds.reduce((prev: Entity[], next) => {
      const plugin = App.plugins.find(f => f.id === next);
      if (!plugin) return prev;
      return prev.concat(plugin.ships);
    }, []);
    return allShips;
  }
  serialize() {
    // Get all of the entities in the world and serialize them into objects
    return {
      id: this.id,
      name: this.name,
      paused: this.paused,
      date: this.date,
      pluginIds: this.pluginIds,
      entities: this.ecs.entities.map(e => e.serialize()),
    };
  }
}

@InputType()
class FlightStartSimulator {
  @Field(type => ID)
  shipId!: string;
  @Field()
  shipName!: string;
  @Field({nullable: true})
  crewCount?: number;
  @Field(type => ID, {nullable: true})
  stationComplementId?: string;
  @Field({nullable: true})
  crewCaptain?: boolean;
  @Field()
  flightDirector!: boolean;
  @Field(type => ID, {nullable: true})
  missionId?: string;
  @Field(type => ID, {nullable: true})
  startingPointId?: string;
}

@Resolver(Flight)
export class FlightResolver {
  @Query(returns => Flight, {nullable: true, name: "flight"})
  flightQuery(): Flight | null {
    return App.activeFlight;
  }
  @Query(returns => [Flight])
  async flights(@Ctx() context: GraphQLContext): Promise<Partial<Flight>[]> {
    let files: string[];
    try {
      files = await fs.readdir(`${appStoreDir}flights/`);
    } catch {
      await fs.mkdir(`${appStoreDir}flights/`);
      files = [];
    }
    const flightFiles = files.filter(f => f.includes(".flight"));
    const flightData = await Promise.all(
      flightFiles.map(async flightName => {
        const raw = await fs.readFile(
          `${appStoreDir}flights/${flightName}`,
          "utf-8"
        );
        const data = JSON.parse(raw);
        return {...data, date: new Date(data.date)} as Flight;
      })
    );

    return flightData;
  }

  @Mutation(returns => Flight)
  flightStart(
    @Arg("flightName", type => String, {nullable: true})
    flightName: string = randomWords(3).join("-"),
    @Arg("plugins", type => [ID])
    plugins: string[],
    @Arg("simulators", type => [FlightStartSimulator])
    simulators: FlightStartSimulator[]
  ): Flight {
    // When we start our flight, we need a list of plugins that will be active.
    // If a mission is selected, all of the plugins referenced by that mission
    // will also be activated. For custom flights, you just choose which plugins
    // are active.
    if (!App.activeFlight) {
      flightName = flightName || randomWords(3).join("-");
      const flight = getStore<Flight>({
        class: Flight,
        path: `${appStoreDir}flights/${flightName}.flight`,
        initialData: {name: flightName, initialLoad: true},
      });
      App.activeFlight = flight;
      App.storage.activeFlightName = flight.name;

      App.activeFlight.pluginIds = plugins;
      App.activeFlight.activatePlugins(true);

      // Generate the ships for the simulators.
      simulators.forEach(
        ({
          flightDirector,
          shipId,
          shipName,
          crewCaptain,
          crewCount,
          missionId,
          startingPointId,
          stationComplementId,
        }) => {
          const startingObject = App.activeFlight?.ecs.entities.find(
            o => o.id === startingPointId
          );
          let startingSystemId =
            startingObject?.satellite?.parentId ||
            startingObject?.interstellarPosition?.systemId;
          while (true) {
            if (!startingSystemId) {
              flight.removeFile();
              App.activeFlight = null;
              throw new Error(
                "Cannot start flight: Ship starting position not found."
              );
            }
            const startingSystem = App.activeFlight?.ecs.entities.find(
              o => o.id === startingSystemId
            );
            if (startingSystem?.planetarySystem) break;
            startingSystemId = startingSystem?.satellite?.parentId;
          }
          let origin = new Vector3();
          if (startingObject?.satellite?.parentId) {
            const parent = App.activeFlight?.ecs.entities.find(
              e => e.id === startingObject.satellite?.parentId
            );
            if (parent?.satellite) {
              origin = getOrbitPosition({
                ...parent.satellite,
                radius: parent.satellite.distance,
              });
            }
          }
          const objectPosition = startingObject?.position ||
            (startingObject?.satellite &&
              getOrbitPosition({
                ...startingObject.satellite,
                radius: startingObject.satellite.distance,
                origin,
              })) || {
              x: -0.5 * Math.random() * 100000000,
              y: -0.5 * Math.random() * 10000,
              z: -0.5 * Math.random() * 100000000,
            };
          // TODO: Once docking gets sorted out, make it so the ship can start out docked with a starbase.
          // Add a bit to the position based on the scale of the object.
          // Both of these units are in kilometers
          const startObjectScale =
            startingObject?.isPlanet?.radius ||
            startingObject?.size?.value ||
            1;
          const distanceVector = new Vector3(
            startObjectScale * 2 + (Math.random() - 0.5) * startObjectScale,
            0,
            startObjectScale * 2 + (Math.random() - 0.5) * startObjectScale
          );
          const position = new Vector3(
            objectPosition.x + distanceVector.x,
            objectPosition.y,
            objectPosition.z + distanceVector.z
          );
          const ship = shipSpawn(
            shipId,
            startingSystemId,
            position,
            App.activeFlight?.ecs,
            shipName
          );
          if (!ship) {
            flight.removeFile();
            App.activeFlight = null;
            throw new Error("Cannot start flight: Error creating ship.");
          }
          ship.addComponent("isPlayerShip");
          if (flightDirector) {
            ship?.addComponent("hasFlightDirector");
          }
          // Create a station set based on the simulator parameters
          let stationComplement: StationComplementComponent | null = null;
          if (stationComplementId) {
            stationComplement = App.plugins.reduce(
              (prev: StationComplementComponent | null, plugin) => {
                if (prev) return prev;
                const stationComplement = plugin.stationComplements.find(
                  s => s.id === stationComplementId
                );
                return stationComplement || null;
              },
              null
            );
          }
          if (!stationComplement) {
            stationComplement = createStationComplement({
              crewCount,
              flightDirector,
              crewCaptain,
              ship,
            });
          }
          ship.addComponent("stationComplement", stationComplement);
          // TODO: Take care of the mission shindig.
        }
      );
      App.startBonjour();
    }
    pubsub.publish("flight", {});
    return App.activeFlight;
  }

  @Mutation(returns => Flight, {nullable: true})
  flightPause(): Flight | null {
    App.activeFlight?.setPaused(true);
    pubsub.publish("flight", {});
    return App.activeFlight;
  }
  @Mutation(returns => Flight, {nullable: true})
  flightResume(): Flight | null {
    App.activeFlight?.setPaused(false);
    pubsub.publish("flight", {});
    return App.activeFlight;
  }
  @Mutation(returns => Flight, {nullable: true})
  flightReset(): Flight | null {
    App.activeFlight?.reset();
    pubsub.publish("flight", {});
    return App.activeFlight;
  }
  @Mutation(returns => String, {nullable: true})
  flightStop(): null {
    // Save the flight, but don't delete it.
    App.activeFlight?.setPaused(true);
    if (isWritableFlight(App.activeFlight)) {
      App.activeFlight?.writeFile();
    }
    App.storage.clients.forEach(c => {
      c.setShip(null);
      c.setStation(null);
      pubsub.publish("client", {client: c, clientId: c.id});
    });
    pubsub.publish("clients", {clients: App.storage.clients});
    App.activeFlight = null;
    App.storage.activeFlightName = null;
    App.stopBonjour();
    pubsub.publish("flight", {});
    return null;
  }
  @Mutation(returns => String, {nullable: true})
  async flightDelete(
    @Arg("flightName", type => String)
    flightName: string
  ): Promise<null> {
    if (App.activeFlight?.name === flightName) {
      App.activeFlight = null;
      App.storage.activeFlightName = null;
    }
    try {
      await fs.unlink(`${appStoreDir}flights/${flightName}.flight`);
    } catch {
      // Do nothing; the file probably didn't exist.
    }
    pubsub.publish("flight", {});
    return null;
  }
  @Subscription(returns => Flight, {
    nullable: true,
    topics: () => {
      const id = uuid();
      process.nextTick(() => {
        pubsub.publish(id, {});
      });
      return [id, "flight"];
    },
  })
  flight(): Flight | null {
    return App.activeFlight;
  }
}
