import {Client} from "@server/init/liveQuery";
import {pubsub} from "@server/init/pubsub";
import {router} from "@server/init/router";
import {t} from "@server/init/t";
import {capitalCase} from "change-case";
import {z} from "zod";
import {zodToJsonSchema} from "zod-to-json-schema";

export const thorium = t.router({
  hasHost: t.procedure.request(({ctx}) => {
    const hasHost = Object.values(ctx.server.clients).some(
      client => client.isHost && client.connected
    );
    return hasHost;
  }),
  claimHost: t.procedure.send(({ctx}) => {
    const hasExistingHost = Object.values(ctx.server.clients).some(client => {
      return client.isHost && client.connected;
    });
    if (!hasExistingHost) {
      ctx.client.isHost = true;
    }

    pubsub.publish.client.all();
    pubsub.publish.client.get({clientId: ctx.id});
    pubsub.publish.thorium.hasHost();
  }),
  actions: t.procedure.request(function getActions() {
    const actions = Object.entries(router._def.procedures)
      // @ts-expect-error This does have the meta type
      .filter(([name, p]) => p._def.meta?.action)
      .map(([name, p]) => {
        // @ts-expect-error This does have the input type
        let input = p._def.inputs[0];
        // @ts-expect-error This does have the meta type
        const inputs = p._def.meta?.inputs;
        if (inputs) {
          input = input.pick(
            inputs.reduce((acc: Record<string, boolean>, i: string) => {
              acc[i] = true;
              return acc;
            }, {})
          );
        }
        return {
          action: name,
          name: name
            .split(".")
            .map(s => capitalCase(s))
            .join(": "),
          input: input ? zodToJsonSchema(input) : {},
        };
      }) as any;

    return actions as {name: string; action: string; input: any}[];
  }),
  events: t.procedure.request(function getEvents() {
    const events = Object.entries(router._def.procedures)
      // @ts-expect-error This does have the meta type
      .filter(([name, p]) => p._def.meta?.event)
      .map(([name, p]) => {
        // @ts-expect-error This does have the input type
        let input = p._def.inputs[0];
        // @ts-expect-error This does have the meta type
        const inputs = p._def.meta?.inputs;
        if (inputs) {
          input = input.pick(
            inputs.reduce((acc: Record<string, boolean>, i: string) => {
              acc[i] = true;
              return acc;
            }, {})
          );
        }
        return {
          event: name,
          name: name
            .split(".")
            .map(s => capitalCase(s))
            .join(": "),
          input: input ? zodToJsonSchema(input) : {},
        };
      }) as any;

    return events as {name: string; event: string; input: any}[];
  }),
  delay: t.procedure
    .meta({action: true})
    .input(
      z.object({
        milliseconds: z.coerce.number(),
      })
    )
    .send(async ({input}) => {
      await new Promise(resolve => setTimeout(resolve, input.milliseconds));
    }),
  debug: t.procedure
    .meta({action: true})
    .input(z.object({message: z.string()}))
    .send(({input}) => {
      console.debug(input.message);
    }),
});
