import {
  Field,
  ID,
  Resolver,
  Query,
  Arg,
  Mutation,
  ObjectType,
  Ctx,
} from "type-graphql";
import uuid from "uniqid";
import randomWords from "random-words";
import fs from "fs/promises";

import App, {isWritableFlight} from "../app";
import ECS from "../helpers/ecs/ecs";
import Components from "../components";
import Entity from "../helpers/ecs/entity";
import getStore from "../helpers/dataStore";
import {appStoreDir} from "../helpers/appPaths";
import {TimerSystem} from "../systems/TimerSystem";
import {GraphQLContext} from "../helpers/graphqlContext";
import {AutoRotateSystem} from "server/systems/AutoRotateSystem";
import {ThrusterSystem} from "server/systems/ThrusterSystem";
import {RotationSystem} from "server/systems/RotationSystem";
import {ImpulseSystem} from "server/systems/ImpulseSystem";
import {WarpSystem} from "server/systems/WarpSystem";
import {WarpVelocityPosition} from "server/systems/WarpVelocityPosition";
import {EngineVelocitySystem} from "server/systems/EngineVelocitySystem";
import {PositionVelocitySystem} from "server/systems/PositionVelocitySystem";
import {getPlugin} from "./plugins/basePlugin";

const INTERVAL = 1000 / 5;

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
      entities: Partial<Entity>[];
    }> = {}
  ) {
    this.id = params.id || uuid();
    this.name = params.name || randomWords(3).join("-");
    this.paused = params.paused || true;
    this.date = params.date ? new Date(params.date) : new Date();

    this.activatePlugins();

    params.entities?.forEach(f => {
      const e = new Entity({...f});
      this.ecs.addEntity(e);
    });

    this.ecs.addSystem(new TimerSystem());
    this.ecs.addSystem(new AutoRotateSystem());
    this.ecs.addSystem(new ThrusterSystem());
    this.ecs.addSystem(new ImpulseSystem());
    this.ecs.addSystem(new WarpSystem());
    this.ecs.addSystem(new RotationSystem());
    this.ecs.addSystem(new EngineVelocitySystem());
    this.ecs.addSystem(new WarpVelocityPosition());
    this.ecs.addSystem(new PositionVelocitySystem());

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

  @Field(type => Entity)
  get ships() {
    return this.ecs.entities.filter(f => f.components.isShip);
  }
  serialize() {
    // Get all of the entities in the world and serialize them into objects
    return {
      id: this.id,
      name: this.name,
      paused: this.paused,
      date: this.date,
      entities: this.ecs.entities.map(e => ({
        id: e.id,
        pluginId: e.pluginId,
        components: e.components,
        systems: [],
      })),
    };
  }
}

@Resolver(Flight)
export class FlightResolver {
  @Query(returns => Flight, {nullable: true})
  flight(): Flight | null {
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
    plugins: string[]
  ): Flight {
    // When we start our flight, we need a list of plugins that will be active.
    // If a mission is selected, all of the plugins referenced by that mission
    // will also be activated. For custom flights, you just choose which plugins
    // are active.
    if (!App.activeFlight) {
      const flight = getStore<Flight>({
        class: Flight,
        path: `${appStoreDir}flights/${flightName}.flight`,
        initialData: {name: flightName, initialLoad: true},
      });
      App.activeFlight = flight;
      App.storage.activeFlightName = flight.name;

      App.activeFlight.pluginIds = plugins;
      App.activeFlight.activatePlugins(true);
    }
    return App.activeFlight;
  }

  @Mutation(returns => Flight, {nullable: true})
  flightPause(): Flight | null {
    App.activeFlight?.setPaused(true);
    return App.activeFlight;
  }
  @Mutation(returns => Flight, {nullable: true})
  flightResume(): Flight | null {
    App.activeFlight?.setPaused(false);
    return App.activeFlight;
  }
  @Mutation(returns => Flight, {nullable: true})
  flightReset(): Flight | null {
    App.activeFlight?.reset();
    return App.activeFlight;
  }
  @Mutation(returns => String, {nullable: true})
  flightStop(): null {
    // Save the flight, but don't delete it.
    App.activeFlight?.setPaused(true);
    if (isWritableFlight(App.activeFlight)) {
      App.activeFlight?.writeFile();
    }
    App.activeFlight = null;
    App.storage.activeFlightName = null;
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
    return null;
  }
}
