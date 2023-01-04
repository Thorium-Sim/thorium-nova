import {t} from "@server/init/t";

export const server = t.router({
  snapshot: t.procedure.send(({ctx}) => {
    const server = ctx.server;
    server.writeFile(true);
    server.plugins.forEach(plugin => {
      plugin.writeFile(true);
    });
    const flight = ctx.flight;
    flight?.writeFile(true);
  }),
});
