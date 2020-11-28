import {GraphQLContext} from "server/helpers/graphqlContext";
import {pubsub} from "server/helpers/pubsub";
import {randomFromList} from "server/helpers/randomFromList";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  registerEnumType,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

export enum EffectOptions {
  flash = "flash",
  spark = "spark",
  reload = "reload",
  speak = "speak",
  message = "message",
  sound = "sound",
  blackout = "blackout",
  online = "online",
  offline = "offline",
  power = "power",
  lockdown = "lockdown",
  maintenance = "maintenance",
  shutdown = "shutdown",
  restart = "restart",
  sleep = "sleep",
  quit = "quit",
  beep = "beep",
}

registerEnumType(EffectOptions, {
  name: "EffectOptions",
});

@InputType("EffectConfigInput")
@ObjectType()
class EffectConfig {
  @Field({nullable: true})
  message!: string;
  @Field({nullable: true})
  voice!: string;
  @Field({nullable: true})
  duration!: number;
}
@ObjectType()
class Effect {
  @Field()
  effect: EffectOptions;
  @Field(type => EffectConfig, {nullable: true})
  config: EffectConfig | null;
  constructor(effect: EffectOptions, config: EffectConfig | null) {
    this.effect = effect;
    this.config = config;
  }
}

interface Payload {
  effect: EffectOptions;
  config: EffectConfig | null;
  station: string;
  shipId: string;
  randomStation: string;
}
@Resolver(Effect)
export class EffectResolver {
  @Mutation(returns => String)
  effectTrigger(
    @Arg("effect", type => EffectOptions)
    effect: EffectOptions,
    @Arg("config", type => EffectConfig, {nullable: true})
    config: EffectConfig,
    @Arg("station")
    station: string,
    @Ctx()
    context: GraphQLContext
  ): string {
    const randomStation = randomFromList(
      context.ship?.stationComplement?.stations || []
    )?.name;
    const payload: Payload = {
      effect,
      config,
      station,
      shipId: context.client?.shipId || "",
      randomStation,
    };
    // TODO: Properly handle all of the effects that are not handled client-side, such as
    // offline card transitions.
    pubsub.publish("effect", payload);
    return "";
  }

  @Subscription(returns => Effect, {
    topics: "effect",
    filter: ({
      payload,
      context,
    }: {
      payload: Payload;
      context: GraphQLContext;
    }) => {
      if (context.client?.shipId !== payload.shipId) return false;
      switch (payload.station) {
        case "all":
          return true;
        case "bridge":
          const notBridgeStation = [
            "Viewscreen",
            "Blackout",
            "Flight Director",
          ];
          return !notBridgeStation.includes(context.client.station?.name || "");
        case "random":
          return context.client.station?.name === payload.randomStation;
        default:
          return context.client.station?.name === payload.station;
      }
    },
  })
  effect(@Root() payload: Payload): Effect | null {
    return new Effect(payload.effect, payload.config);
  }
}
