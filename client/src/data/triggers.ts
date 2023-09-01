import {isTrigger} from "@server/components/isTrigger";
import {t} from "@server/init/t";
import {Entity} from "@server/utils/ecs";
import {z} from "zod";

export const triggers = t.router({
  create: t.procedure
    .meta({
      action: true,
      inputs: ["name", "tags"],
    })
    .input(
      isTrigger.removeDefault().extend({
        name: z.string().describe("Trigger Name"),
        tags: z.array(z.string()).default([]),
      })
    )
    .send(async ({ctx, input}) => {
      const {name, ...trigger} = input;
      const entity = new Entity();
      entity.addComponent("identity", {name});
      entity.addComponent("isTrigger", trigger);
      entity.addComponent("tags", {tags: input.tags});

      ctx.flight?.ecs.addEntity(entity);

      return {triggerId: entity.id};
    }),
});
