import ImpulseEnginesPlugin from "@server/classes/Plugins/ShipSystems/ImpulseEngines";
import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import inputAuth from "@server/utils/inputAuth";
import {z} from "zod";
import {
  getShipSystem,
  getShipSystemForInput,
  pluginFilter,
  systemInput,
} from "../utils";

export const impulse = t.router({
  get: t.procedure
    .input(systemInput)
    .filter(pluginFilter)
    .request(({ctx, input}) => {
      const system = getShipSystem({input, ctx});

      if (system.type !== "impulseEngines")
        throw new Error("System is not Impulse Engine");

      return system as ImpulseEnginesPlugin;
    }),
  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        systemId: z.string(),
        shipPluginId: z.string().optional(),
        shipId: z.string().optional(),
        cruisingSpeed: z.number().optional(),
        emergencySpeed: z.number().optional(),
        thrust: z.number().optional(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const [system, override] = getShipSystemForInput<"impulseEngines">(
        ctx,
        input
      );
      const shipSystem = override || system;

      if (typeof input.cruisingSpeed === "number") {
        shipSystem.cruisingSpeed = input.cruisingSpeed;
      }
      if (typeof input.emergencySpeed === "number") {
        shipSystem.emergencySpeed = input.emergencySpeed;
      }
      if (typeof input.thrust === "number") {
        shipSystem.thrust = input.thrust;
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
