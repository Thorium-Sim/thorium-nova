import ReactorPlugin from "@server/classes/Plugins/ShipSystems/Reactor";
import {pubsub} from "@server/init/pubsub";
import {t} from "@server/init/t";
import inputAuth from "@server/utils/inputAuth";
import {z} from "zod";
import {
  getShipSystem,
  getShipSystemForInput,
  pluginFilter,
  systemInput,
} from "../utils";

export const reactor = t.router({
  get: t.procedure
    .input(systemInput)
    .filter(pluginFilter)
    .request(({ctx, input}) => {
      const system = getShipSystem({input, ctx});

      if (system.type !== "reactor") throw new Error("System is not Reactor");

      return system as ReactorPlugin;
    }),
  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        systemId: z.string(),
        shipPluginId: z.string().optional(),
        shipId: z.string().optional(),
        optimalOutputPercent: z.number().optional(),
        reactorCount: z.number().optional(),
        powerMultiplier: z.number().optional(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const [system, override] = getShipSystemForInput<"reactor">(ctx, input);
      const shipSystem = override || system;

      if (typeof input.optimalOutputPercent === "number") {
        shipSystem.optimalOutputPercent = Math.min(
          1,
          Math.max(0, input.optimalOutputPercent)
        );
      }
      if (typeof input.reactorCount === "number") {
        shipSystem.reactorCount = Math.max(0, input.reactorCount);
      }
      if (typeof input.powerMultiplier === "number") {
        shipSystem.powerMultiplier = Math.max(0, input.powerMultiplier);
      }

      pubsub.publish.plugin.systems.get({
        pluginId: input.pluginId,
      });
      if (input.shipPluginId && input.shipId) {
        pubsub.publish.plugin.ship.get({
          pluginId: input.shipPluginId,
          shipId: input.shipId,
        });
      }

      return shipSystem;
    }),
});
