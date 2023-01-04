import {Client} from "@server/init/liveQuery";
import {pubsub} from "@server/init/pubsub";
import {t} from "@server/init/t";

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
});
