import {
  Field,
  ID,
  Resolver,
  Query,
  Arg,
  Mutation,
  ObjectType,
  Subscription,
  Root,
} from "type-graphql";
import uuid from "uniqid";
import randomWords from "random-words";
import {performance} from "perf_hooks";

import App from "../app";

const INTERVAL = 1000 / 5;

@ObjectType()
export default class Flight {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  lastTime: number = Math.round(performance.now());
  ticks: number = 0;
  constructor(params: Partial<Flight> = {}) {
    this.id = params.id || uuid();
    this.name = params.name || randomWords(3).join("-");

    this.run();
  }
  run = () => {
    // Compute delta and elapsed time
    const time = Math.round(performance.now());
    const delta = time - this.lastTime;
    this.ticks++;
    // Run all the systems

    this.lastTime = time;
    setTimeout(this.run, INTERVAL);
  };

  serialize() {
    // Get all of the entities in the world and serialize them into objects
  }
}

@ObjectType()
export class Coordinate {
  @Field()
  x!: number;
  @Field()
  y!: number;
  @Field()
  z!: number;
}

@ObjectType()
export class MovingObject {
  @Field(type => ID)
  id!: string;

  @Field()
  Position!: Coordinate;
  @Field()
  Velocity!: Coordinate;
  @Field()
  Acceleration!: Coordinate;
}

interface ObjectPayload {
  flightId: string;
  objects: MovingObject[];
}
@Resolver(Flight)
export class FlightResolver {
  @Query(returns => Flight, {nullable: true})
  flight(): Flight | null {
    return App.activeFlight;
  }

  @Mutation(returns => Flight)
  flightStart(): Flight {
    if (!App.activeFlight) {
      App.activeFlight = new Flight();
    }
    return App.activeFlight;
  }

  @Subscription(returns => [MovingObject], {
    topics: ["objects"],
  })
  objects(@Root() objectPayload: ObjectPayload): MovingObject[] {
    return objectPayload.objects;
  }
}
