import {t} from "@server/init/t";
import {ship} from "./ship";
import {mission} from "./mission";
import {theme} from "./themes";
import {systems} from "./systems";
import {starmap} from "./starmap";
import {inventory} from "./inventory";
import {z} from "zod";
import inputAuth from "@server/utils/inputAuth";
import BasePlugin from "@server/classes/Plugins";
import {pubsub} from "@server/init/pubsub";
import {getPlugin} from "./utils";
import path from "path";
import {thoriumPath} from "@server/utils/appPaths";
import fs from "fs/promises";

export function publish(pluginId: string) {
  pubsub.publish.plugin.all();
  pubsub.publish.plugin.get({pluginId});
}

export const plugin = t.router({
  ship,
  mission,
  theme,
  systems,
  starmap,
  inventory,
  all: t.procedure.request(({ctx}) => {
    return ctx.server.plugins;
  }),
  get: t.procedure
    .input(z.object({pluginId: z.string().catch("")}))
    .filter((publish: {pluginId: string} | null, {input}) => {
      if (publish && input.pluginId !== publish.pluginId) return false;
      return true;
    })
    .request(({ctx, input}) => {
      return ctx.server.plugins.find(plugin => plugin.id === input.pluginId);
    }),
  create: t.procedure
    .input(z.object({name: z.string()}))
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = new BasePlugin(input, ctx.server);
      ctx.server.plugins.push(plugin);
      publish(plugin.id);
      return {pluginId: plugin.id};
    }),
  delete: t.procedure
    .input(z.object({pluginId: z.string()}))
    .send(async ({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      await plugin.removeFile();
      ctx.server.plugins.splice(ctx.server.plugins.indexOf(plugin), 1);
      publish(plugin.id);
    }),
  duplicate: t.procedure
    .input(z.object({pluginId: z.string(), name: z.string()}))
    .send(async ({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);

      const pluginCopy = plugin.duplicate(input.name);
      ctx.server.plugins.push(pluginCopy);
      publish(plugin.id);
      return {pluginId: pluginCopy.id};
    }),
  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        tags: z.string().array().optional(),
        coverImage: z.union([z.string(), z.instanceof(File)]).optional(),
        active: z.boolean().optional(),
      })
    )
    .send(async ({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (input.description) {
        plugin.description = input.description;
      }

      if (input.tags) {
        plugin.tags = input.tags;
      }
      if (typeof input.coverImage === "string") {
        const ext = path.extname(input.coverImage);
        const coverImagePath = path.join(
          thoriumPath,
          plugin.pluginPath,
          `assets/coverImage${ext}`
        );

        await fs.mkdir(path.dirname(coverImagePath), {recursive: true});
        await fs.rename(input.coverImage, coverImagePath);
        plugin.coverImage = `${plugin.pluginPath}/assets/coverImage${ext}`;
      }
      if (input.active !== undefined) {
        plugin.active = input.active;
      }
      if (input.name) {
        await plugin.rename(input.name);
      }
      publish(plugin.id);
      return {pluginId: plugin.id};
    }),
});
