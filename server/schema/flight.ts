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
import {World, Entity} from "ecsy";
import randomWords from "random-words";
import {performance} from "perf_hooks";
import Position from "../../shared/components/Position";
import Velocity from "../../shared/components/Velocity";
import Acceleration from "../../shared/components/Acceleration";
import Movement from "../../shared/systems/Movement";

import Networkable from "../components/Networkable";
import Network from "../systems/network";
import App from "../app";

const INTERVAL = 1000 / 5;

@ObjectType()
export default class Flight {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  world: World;
  lastTime: number = Math.round(performance.now());
  ticks: number = 0;
  constructor(params: Partial<Flight> = {}) {
    this.id = params.id || uuid();
    this.name = params.name || randomWords(3).join("-");
    this.world = new World();

    // Add the systems
    this.world
      .registerComponent(Position)
      .registerComponent(Velocity)
      .registerComponent(Acceleration)
      .registerComponent(Networkable)
      .registerSystem(Movement)
      .registerSystem(Network, {flightId: this.id});

    this.run();
  }
  run = () => {
    // Compute delta and elapsed time
    const time = Math.round(performance.now());
    const delta = time - this.lastTime;
    this.ticks++;
    // Run all the systems
    this.world.execute(delta, this.ticks);

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
  // @Query((returns) => [MovingObject])
  // objects(): MovingObject[] {
  //   // @ts-ignore
  //   const entities = (App.activeFlight?.world.entityManager._entities ||
  //     []) as Entity[];

  //   return entities.map((e) => {
  //     const PositionData = e.getComponent(Position);
  //     const VelocityData = e.getComponent(Velocity);
  //     const AccelerationData = e.getComponent(Acceleration);

  //     return {
  //       id: String(e.id),
  //       Position: PositionData,
  //       Velocity: VelocityData,
  //       Acceleration: AccelerationData,
  //     };
  //   });
  // }

  @Mutation(returns => Flight)
  flightStart(): Flight {
    if (!App.activeFlight) {
      App.activeFlight = new Flight();
    }
    return App.activeFlight;
  }
  @Mutation(returns => String)
  addObject(): string {
    const flight = App.activeFlight;
    for (let i = 0; i < 1; i++) {
      flight?.world
        .createEntity(uuid())
        .addComponent(Position)
        .addComponent(Velocity)
        .addComponent(Acceleration)
        .addComponent(Networkable);
    }
    return "";
  }

  @Subscription(returns => [MovingObject], {
    topics: ["objects"],
  })
  objects(@Root() objectPayload: ObjectPayload): MovingObject[] {
    return objectPayload.objects;
  }
}
