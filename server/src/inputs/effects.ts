import {DataContext} from "../utils/DataContext";
import type {EffectConfig, EffectOptions} from "../netRequests/effects";
import {pubsub} from "../utils/pubsub";
import {randomFromList} from "../utils/randomFromList";

type EffectInputParams =
  | {
      effect: EffectOptions;
      config: EffectConfig;
      station: "all" | "bridge" | string;
      shipId: number;
      clientId?: null;
    }
  | {
      effect: EffectOptions;
      config: EffectConfig;
      station: null;
      shipId: null;
      clientId: string;
    };
export const effectsInputs = {
  effectTrigger(context: DataContext, params: EffectInputParams) {
    const stationList =
      context.flight?.ecs.getEntityById(params.shipId ?? -1)?.components
        .stationComplement?.stations || [];
    const randomStation = randomFromList(stationList)?.name;
    const payload = {
      effect: params.effect,
      config: params.config,
      station: params.station ?? randomStation,
      shipId: params.shipId ?? -1,
      clientId: params.clientId ?? null,
    };
    // TODO: Properly handle all of the effects that are not handled client-side, such as
    // offline card transitions.
    pubsub.publish("effects", payload);
    return "";
  },
};
