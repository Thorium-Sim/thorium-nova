import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import {z} from "zod";

export const alertLevel = t.router({
    update: t.procedure
      .input(z.object({level: z.string()}))
      .send(({ctx, input}) => {
        if (!ctx.ship) throw new Error("Ship not found");

        ctx.ship.updateComponent('isShip', {alertLevel:input.level});
        pubsub.publish.ship.get({shipId: ctx.ship.id});
      })
});