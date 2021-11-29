import {DataContext} from "../utils/DataContext";

export enum EffectOptions {
  flash = "flash",
  spark = "spark",
  reload = "reload",
  speak = "speak",
  message = "message",
  sound = "sound",

  // TODO November 29, 2021 - Make these effects only work
  // when the target client allows them. They should only
  // work on Electron clients anyway.
  // shutdown = "shutdown",
  // restart = "restart",
  // sleep = "sleep",
  // quit = "quit",
}

export interface EffectConfig {
  message: string;
  voice: string;
  duration: number;
}

export interface Payload {
  effect: EffectOptions;
  config: EffectConfig | null;
  station: string | null;
  shipId: number | null;
  clientId: string | null;
}

const notBridgeStation = ["Viewscreen", "Blackout", "Flight Director"];
export const effectsRequest = {
  effects: async (context: DataContext, params: {}, payload: Payload) => {
    if (!payload) return null;

    if (payload.clientId !== context.clientId) {
      if (context.flightClient?.shipId !== payload.shipId) throw null;

      switch (payload.station) {
        case "all":
          break;
        case "bridge":
          if (
            !context.flightClient?.stationId ||
            notBridgeStation.includes(context.flightClient.stationId)
          )
            throw null;
          break;
        default:
          if (context.flightClient.stationId !== payload.station) throw null;
      }
    }

    return {effect: payload.effect, config: payload.config};
  },
};
