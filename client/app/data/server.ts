import {initDefaultPlugin} from "@server/init/initDefaultPlugin";
import {t} from "@server/init/t";
import path from "path";
import fs from "fs/promises";
import {pubsub} from "@server/init/pubsub";

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
  restoreDefaultPlugin: t.procedure.send(async ({ctx}) => {
    // Delete any default plugins
    const defaultPlugins = ctx.server.plugins.filter(p => p.default);
    await Promise.all(
      defaultPlugins.map(p =>
        fs.rm(path.dirname(p.filePath), {recursive: true, force: true})
      )
    );
    await initDefaultPlugin();
    pubsub.publish.plugin.all();
    defaultPlugins.forEach(plugin =>
      pubsub.publish.plugin.get({pluginId: plugin.id})
    );
  }),
});
