import TimelinePlugin from "@server/classes/Plugins/Timeline";
import {t} from "@server/init/t";
import {FlightStartingPoint} from "@server/utils/types";
import {z} from "zod";
import {getPlugin} from "./utils";
import inputAuth from "@server/utils/inputAuth";
import {pubsub} from "@server/init/pubsub";
import fs from "fs/promises";
import path from "path";
import {thoriumPath} from "@server/utils/appPaths";
import {moveArrayItem} from "@server/utils/moveArrayItem";
import uniqid from "@thorium/uniqid";

const action = t.router({
  add: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
        action: z.string(),
        name: z.string(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      if (!input.stepId) throw new Error("Step ID is required");
      const step = timeline.steps.find(step => step.id === input.stepId);
      if (!step) throw new Error("Step not found");
      const id = uniqid("act-");
      step.actions.push({
        id,
        name: input.name,
        action: input.action,
        values: {},
      });
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {actionId: id};
    }),
  reorder: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
        actionId: z.string(),
        newIndex: z.number(),
      })
    )
    .send(({ctx, input}) => {
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      if (!input.stepId) throw new Error("Step ID is required");
      const step = timeline.steps.find(step => step.id === input.stepId);
      if (!step) throw new Error("Step not found");
      const actionIndex = step.actions.findIndex(
        action => action.id === input.actionId
      );
      moveArrayItem(step.actions, actionIndex, input.newIndex);
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {actionId: input.actionId};
    }),
  delete: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
        actionId: z.string(),
      })
    )
    .send(({ctx, input}) => {
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      if (!input.stepId) throw new Error("Step ID is required");
      const step = timeline.steps.find(step => step.id === input.stepId);
      if (!step) throw new Error("Step not found");
      const actionIndex = step.actions.findIndex(
        action => action.id === input.actionId
      );
      step.actions.splice(actionIndex, 1);
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {actionId: input.actionId};
    }),
  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
        actionId: z.string(),
        name: z.string().optional(),
        values: z.record(z.any()).optional(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      const step = timeline.steps.find(step => step.id === input.stepId);
      if (!step) throw new Error("Step not found");
      const action = step.actions.find(action => action.id === input.actionId);
      if (!action) throw new Error("Action not found");
      if (input.name) action.name = input.name;
      if (input.values) action.values = input.values;
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {actionId: action.id};
    }),
});

const step = t.router({
  add: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        name: z.string(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      const stepId = timeline.addStep(input.name);
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });

      return {timelineId: timeline.name, stepId};
    }),
  insert: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        name: z.string(),
        stepId: z.string(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      const stepId = timeline.insertStep(input.name, input.stepId);
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });

      return {timelineId: timeline.name, stepId};
    }),
  duplicate: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      const stepId = timeline.duplicateStep(input.stepId);
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });

      return {timelineId: timeline.name, stepId};
    }),
  delete: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      const stepIndex = timeline.steps.findIndex(
        step => step.id === input.stepId
      );
      timeline.removeStep(input.stepId);
      let alternateStep: number | null = stepIndex;
      if (!timeline.steps[alternateStep]) alternateStep = stepIndex - 1;
      if (!timeline.steps[alternateStep]) alternateStep = stepIndex + 1;
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {alternateStep: timeline.steps[alternateStep]?.id || null};
    }),
  reorder: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
        newIndex: z.number(),
      })
    )
    .send(({ctx, input}) => {
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      const stepIndex = timeline.steps.findIndex(
        step => step.id === input.stepId
      );
      moveArrayItem(timeline.steps, stepIndex, input.newIndex);
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {stepId: input.stepId};
    }),
  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        stepId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw new Error("Timeline not found");
      if (!input.stepId) throw new Error("Step ID is required");
      const step = timeline.steps.find(step => step.id === input.stepId);
      if (!step) throw new Error("Step not found");
      if (input.name) step.name = input.name;
      if (input.description) step.description = input.description;
      if (input.tags) step.tags = input.tags;
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {stepId: step.id};
    }),
  action,
});

export const timeline = t.router({
  all: t.procedure
    .input(z.object({pluginId: z.string()}))
    .filter((publish: {pluginId: string} | null, {input}) => {
      if (!publish || publish.pluginId === input.pluginId) return true;
      return false;
    })
    .request(({ctx, input}) => {
      const plugin = getPlugin(ctx, input.pluginId);
      return plugin.aspects.timelines;
    }),
  get: t.procedure
    .input(z.object({pluginId: z.string(), timelineId: z.string()}))
    .filter(
      (publish: {pluginId: string; timelineId: string} | null, {input}) => {
        if (!publish || publish.pluginId === input.pluginId) return true;
        return false;
      }
    )
    .request(({ctx, input}) => {
      const plugin = getPlugin(ctx, input.pluginId);
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) throw null;
      return timeline;
    }),
  create: t.procedure
    .input(z.object({pluginId: z.string(), name: z.string()}))
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      const timeline = new TimelinePlugin({name: input.name}, plugin);
      plugin.aspects.timelines.push(timeline);

      pubsub.publish.plugin.timeline.all({pluginId: input.pluginId});
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {timelineId: timeline.name};
    }),
  delete: t.procedure
    .input(z.object({pluginId: z.string(), timelineId: z.string()}))
    .send(async ({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) return;
      plugin.aspects.timelines.splice(
        plugin.aspects.timelines.indexOf(timeline),
        1
      );

      await timeline?.removeFile();
      pubsub.publish.plugin.timeline.all({pluginId: input.pluginId});
    }),

  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        timelineId: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        description: z.string().optional(),
        isMission: z.boolean().optional(),
        cover: z.union([z.string(), z.instanceof(File)]).optional(),
      })
    )
    .send(async ({ctx, input}) => {
      inputAuth(ctx);
      const plugin = getPlugin(ctx, input.pluginId);
      if (!input.timelineId) throw new Error("Timeline ID is required");
      const timeline = plugin.aspects.timelines.find(
        timeline => timeline.name === input.timelineId
      );
      if (!timeline) return {timelineId: ""};
      if (input.category) timeline.category = input.category;
      if (input.description) timeline.description = input.description;
      if (input.tags) timeline.tags = input.tags;
      if (typeof input.isMission === "boolean")
        timeline.isMission = input.isMission;
      if (typeof input.cover === "string") {
        const ext = path.extname(input.cover);
        await moveFile(input.cover, `logo${ext}`, "cover");
      }

      if (input.name !== timeline.name && input.name) {
        await timeline?.rename(input.name);
      }
      pubsub.publish.plugin.timeline.all({pluginId: input.pluginId});
      pubsub.publish.plugin.timeline.get({
        pluginId: input.pluginId,
        timelineId: timeline.name,
      });
      return {timelineId: timeline.name};

      async function moveFile(
        file: Blob | File | string,
        filePath: string,
        propertyName: "cover"
      ) {
        if (!timeline) return;
        if (typeof file === "string") {
          await fs.mkdir(path.join(thoriumPath, timeline.assetPath), {
            recursive: true,
          });
          await fs.rename(
            file,
            path.join(thoriumPath, timeline.assetPath, filePath)
          );
          timeline.assets[propertyName] = path.join(
            timeline.assetPath,
            filePath
          );
        }
      }
    }),
  step,
  missions: t.procedure.request(({ctx}) => {
    return ctx.server.plugins.reduce(
      (
        acc: {
          name: string;
          description: string;
          category: string;
          cover: string;
          pluginId: string;
        }[],
        plugin
      ) => {
        if (!plugin.active) return acc;
        const missions = plugin.aspects.timelines
          .filter(timeline => timeline.isMission)
          .map(({name, description, category, assets}) => ({
            name,
            description,
            category,
            cover: assets.cover,
            pluginId: plugin.id,
          }));
        return [...acc, ...missions];
      },
      []
    );
  }),
  startingPoints: t.procedure.request(({ctx}) => {
    return ctx.server.plugins.reduce(
      (points: FlightStartingPoint[], plugin) => {
        if (!plugin.active) return points;

        return points.concat(
          plugin.aspects.solarSystems.flatMap(solarSystem => {
            const planets = solarSystem.planets.map(planet => ({
              pluginId: plugin.id,
              solarSystemId: solarSystem.name,
              objectId: planet.name,
              type: "planet" as const,
            }));
            // TODO May 17, 2022 - Make permanent ships available as starting points.
            return planets;
          })
        );
      },
      []
    );
  }),
});
