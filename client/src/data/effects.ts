import {
  EffectPayload,
  effectConfig,
  effectOptions,
  notBridgeStation,
} from "@client/utils/effects";
import {pubsub} from "@server/init/pubsub";
import {t} from "@server/init/t";
import {randomFromList} from "@server/utils/randomFromList";
import {z} from "zod";

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
