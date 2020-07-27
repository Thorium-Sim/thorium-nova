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

  ecs = new ECS();
  constructor(
    params: Partial<{
      id: string;
      name: string;
      paused: boolean;
      date: Date;
      entities: {id: string; components: Components[]}[];
    }> = {},
  ) {
    this.id = params.id || uuid();
    this.name = params.name || randomWords(3).join("-");
    this.paused = params.paused || false;
    this.date = params.date ? new Date(params.date) : new Date();

    params.entities?.forEach(f => {
      const e = new Entity(f.id, f.components);
      this.ecs.addEntity(e);
    });

    this.ecs.addSystem(new TimerSystem());

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
        components: e.components,
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
    const files = await fs.readdir(`${appStoreDir}/flights/`);
    const flightFiles = files.filter(f => f.includes(".flight"));
    const flightData = await Promise.all(
      flightFiles.map(async flightName => {
        const raw = await fs.readFile(
          `${appStoreDir}flights/${flightName}`,
          "utf-8",
        );
        const data = JSON.parse(raw);
        return {...data, date: new Date(data.date)} as Flight;
      }),
    );

    return flightData;
  }

  @Mutation(returns => Flight)
  flightStart(
    @Arg("flightName", type => String, {nullable: true})
    flightName: string = randomWords(3).join("-"),
  ): Flight {
    if (!App.activeFlight) {
      const flight = getStore<Flight>({
        class: Flight,
        path: `${appStoreDir}/flights/${flightName}.flight`,
        initialData: {name: flightName},
      });
      App.activeFlight = flight;
      App.storage.activeFlightName = flight.name;
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
    flightName: string,
  ): Promise<null> {
    if (App.activeFlight?.name === flightName) {
      App.activeFlight = null;
      App.storage.activeFlightName = null;
    }
    try {
      await fs.unlink(`${appStoreDir}/flights/${flightName}.flight`);
    } catch {
      // Do nothing; the file probably didn't exist.
    }
    return null;
  }
}
