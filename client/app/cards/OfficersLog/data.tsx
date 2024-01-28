import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import {z} from "zod";

export const officersLog = t.router({
  get: t.procedure
    .filter((publish: {clientId: string}, {ctx}) => {
      if (publish && ctx.id !== publish.clientId) return false;
      return true;
    })
    .request(({ctx}) => {
      return ctx.flightClient?.officersLog || [];
    }),
  add: t.procedure
    .input(z.object({message: z.string(), timestamp: z.number()}))
    .send(({ctx, input}) => {
      const {message, timestamp = Date.now()} = input;

      ctx.flightClient?.officersLog.push({
        message,
        timestamp,
      });

      pubsub.publish.officersLog.get({clientId: ctx.id});
    }),
});
