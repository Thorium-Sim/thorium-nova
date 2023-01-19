import {pubsub} from "@server/init/pubsub";
import {t} from "@server/init/t";
import {randomFromList} from "@server/utils/randomFromList";
import {z} from "zod";

export const effectOptions = z.union([
  z.literal("flash"),
  z.literal("spark"),
  z.literal("reload"),
  z.literal("speak"),
  z.literal("message"),
  z.literal("sound"),
]);

// TODO November 29, 2021 - Make these effects only work
// when the target client allows them. They should only
// work on Electron clients anyway.
// "shutdown"
// "restart"
// "sleep"
// "quit"

export const effectConfig = z.object({
  message: z.string().optional(),
  voice: z.string().optional(),
  duration: z.number().optional(),
});

export interface EffectPayload {
  effect: Zod.infer<typeof effectOptions>;
  config: Zod.infer<typeof effectConfig> | null;
  station: string | null;
  shipId: number | null;
  clientId: string | null;
}

export const notBridgeStation = ["Viewscreen", "Blackout", "Flight Director"];

export const effects = t.router({
  sub: t.procedure
    .filter((payload: EffectPayload | null, {ctx}) => {
      if (!payload) return true;

      if (payload.clientId !== ctx.id) {
        if (ctx.flightClient?.shipId !== payload.shipId) return false;

        switch (payload.station) {
          case "all":
            break;
          case "bridge":
            if (
              !ctx.flightClient?.stationId ||
              notBridgeStation.includes(ctx.flightClient.stationId)
            )
              return false;
            break;
          default:
            if (ctx.flightClient.stationId !== payload.station) return false;
        }
      }
      return true;
    })
    .request(({publish}) => {
      if (!publish) return null;

      return {effect: publish.effect, config: publish.config};
    }),
  trigger: t.procedure
    .input(
      z.union([
        z.object({
          effect: effectOptions,
          config: effectConfig,
          shipId: z.number(),
          station: z.union([z.literal("all"), z.literal("bridge"), z.string()]),
        }),
        z.object({
          effect: effectOptions,
          config: effectConfig,
          clientId: z.string(),
        }),
      ])
    )
    .send(({ctx, input}) => {
      const clientId = "clientId" in input ? input.clientId : null;
      const shipId = "shipId" in input ? input.shipId : null;
      let station: string | null = null;
      if ("shipId" in input) {
        const stationList =
          ctx.flight?.ecs.getEntityById(shipId ?? -1)?.components
            .stationComplement?.stations || [];

        station =
          "shipId" in input ? input.station : randomFromList(stationList)?.name;
      }
      const payload = {
        effect: input.effect,
        config: input.config,
        station,
        shipId,
        clientId,
      };
      // TODO: Properly handle all of the effects that are not handled client-side, such as
      // offline card transitions.
      pubsub.publish.effects.sub(payload);
    }),
});
