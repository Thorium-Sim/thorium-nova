import path from "node:path";

import { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import { initECS } from "@thorium/.server/classes/initECS";
import { traverseFiles } from "@thorium/.server/data/traverseFiles";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { flightStartInput, startFlight } from "@thorium/.server/spawners/flight";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { loadYml } from "@thorium/utils/.server/db-fs/loadYml";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { ECS, Entity } from "@thorium/utils/ecs";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import randomWords from "@thorium/utils/random-words";
import z from "zod";

export const flight = t.router({
	active: t.procedure
		.autoPublish(["isFlight"], () => null)
		.request(async ({ ctx }) => {
			const flight = ctx.flight;
			if (!flight) return null;
			const { date, name, paused, hasFlightDirector, mode, state, stateReason } = flight;
			return {
				date,
				name,
				paused,
				hasFlightDirector,
				mode,
				state,
				stateReason,
				snapshots: await flight.getSnapshots(),
			};
		}),
	assets: t.procedure
		.input(z.object({ extensions: z.string().array().optional() }).optional())
		.autoPublish(["isFlight"], () => null)
		.request(async ({ ctx, input }) => {
			const flight = ctx.flight;
			if (!flight) return null;
			const assetUrl = await flight.getAssetUrl();
			const scannedFiles = await traverseFiles(
				path.join(assetUrl, `flights`, flight.name, `assets`),
				assetUrl,
				input?.extensions,
			);
			return scannedFiles;
		}),
	timelines: t.procedure
		.autoPublish(["isTimeline", "isTimelineStep"], () => null)
		.request(({ ctx }) => {
			const timelines = [];
			for (const entity of ctx.ecs.componentCache.get("isTimeline") || []) {
				if (!entity.components.isTimeline) continue;
				timelines.push({
					id: entity.id,
					name: entity.components.identity?.name || "Unknown",
					type: entity.components.isTimeline.type,
					pluginName: entity.components.isTimeline.pluginName,
					currentStep: entity.components.isTimeline.currentStep,
					shipId: entity.components.isTimeline.shipId,
					steps: entity.components.isTimeline.steps.flatMap((s) => {
						const entity = ctx.ecs.getEntityById(s);
						if (!entity?.components.isTimelineStep) return [];
						return {
							id: entity.id,
							name: entity.components.identity?.name || "Unknown",
							state: entity.components.isTimelineStep.state,
							blocks: entity.components.isTimelineStep.blocks,
						};
					}),
				});
			}
			return timelines;
		}),
	all: t.procedure
		.autoPublish(["isFlight"], () => null)
		.request(() => {
			return DataStore.operations.getStore()!.getFlights();
		}),
	start: t.procedure.input(flightStartInput).send(async ({ ctx, input }) => {
		inputAuth(ctx);
		if (ctx.flight) return ctx.flight;
		const flightNames = await DataStore.operations.getStore()!.getFlights();
		const flightName = generateIncrementedName(
			input.flightName || randomWords(3).join("-"),
			flightNames,
		);

		await startFlight(ctx, { ...input, flightName });
		pubsub.publishAll();

		return ctx.flight;
	}),
	stop: t.procedure.send(async ({ ctx }) => {
		inputAuth(ctx);
		// Save the flight, but don't delete it.
		if (!ctx.flight) return null;

		ctx.flight.stop();
		ctx.flight = null;
		ctx.server.activeFlightName = null;

		await ctx.server.write(true);
		// TODO September 1, 2021 - Stop broadcasting this flight with Bonjour.
		pubsub.publishAll();
		return null;
	}),
	load: t.procedure.input(z.object({ flightName: z.string() })).send(async ({ ctx, input }) => {
		inputAuth(ctx);
		if (ctx.flight) return ctx.flight;

		ctx.flight = new FlightDataModel(
			{
				entities: [],
				initialLoad: false,
				serverDataModel: ctx.server,
			},
			{
				meta: {
					filePath: `/flights/${input.flightName}/data.yml`,
					flightName: input.flightName,
				},
			},
		);
		await ctx.flight.initEcs(ctx.server);
		await ctx.flight.initPhysics();

		ctx.server.activeFlightName = input.flightName;
		pubsub.publishAll();
		return ctx.flight;
	}),
	delete: t.procedure.input(z.object({ name: z.string() })).send(async ({ ctx, input }) => {
		inputAuth(ctx);
		if (ctx.flight?.name === input.name) {
			ctx.flight = null;
			ctx.server.activeFlightName = null;
		}
		try {
			await ctx.removeFile(`/flights/${input.name}.flight`);
		} catch {
			// Do nothing; the file probably didn't exist.
		}
		pubsub.publish.flight.active();
		pubsub.publish.flight.all();
		return null;
	}),
	pause: t.procedure.meta({ action: true }).send(({ ctx }) => {
		if (ctx.flight) {
			ctx.flight.paused = true;
			pubsub.publish.flight.active();
		}
		return ctx.flight;
	}),
	resume: t.procedure.send(({ ctx }) => {
		if (ctx.flight) {
			ctx.flight.paused = false;
			ctx.ecs.lastUpdate = ctx.ecs.now();
			ctx.flight.state = "in-progress";
			ctx.flight.stateReason = "";
			pubsub.publish.flight.active();
		}
		return ctx.flight;
	}),
	snapshot: t.procedure
		.input(z.object({ name: z.string().optional() }))
		.meta({ action: true })
		.send(async ({ ctx, input }) => {
			await ctx.flight?.write(true, input.name || new Date().toISOString());
			pubsub.publish.flight.active();
		}),
	restoreSnapshot: t.procedure
		.input(z.object({ name: z.string().optional() }))
		.meta({ action: true })
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) return;

			const assetUrl = await ctx.flight.getAssetUrl();
			const snapshotNames = await ctx.flight.getSnapshots();
			let snapshotPath = "";
			// If no name, pick the most recent snapshot
			if (input.name) {
				if (!snapshotNames.includes(input.name)) {
					throw new Error(`Snapshot not found for flight: ${input.name}`);
				}
				snapshotPath = path.join(assetUrl, `flights`, ctx.flight.name, `${input.name}.yml`);
			} else {
				// Load all the snapshots to see which is the most recently saved.
				snapshotPath = (
					await Promise.all(
						snapshotNames.map(async () => {
							const spath = path.join(assetUrl, "flights", ctx.flight!.name, `${input.name}.yml`);
							const snapshot = loadYml(await ctx.readFile(spath));
							return { path: spath, snapshot };
						}),
					)
				).reduce(
					(prev, next) => {
						if (!prev.path) return next;
						if (next.snapshot.lastSaved > prev.snapshot.lastSaved) return next;
						return prev;
					},
					{ path: "", snapshot: { lastSaved: 0 } },
				).path;
			}
			if (!snapshotPath) {
				throw new Error(`No snapshot available.`);
			}
			const file = await ctx.readFile(snapshotPath);
			const snapshot = loadYml(file);
			if (!("entities" in snapshot)) throw new Error("Invalid snapshot format.");
			// Replace the properties of the flight with the snapshot properties
			ctx.flight.paused = true;
			ctx.flight.ecs.dispose();
			ctx.flight.ecs = new ECS(
				ctx.server,
				snapshot.rng?.seed || "thorium",
				snapshot.rng?.skip || 0,
			);
			initECS(ctx.flight.ecs, snapshot.entities, snapshot.mode);
			ctx.flight.paused = snapshot.paused;
			ctx.flight.state = snapshot.state;
			ctx.flight.stateReason = snapshot.stateReason;
			pubsub.publishAll();
		}),
	reset: t.procedure.send(async ({ ctx }) => {
		if (!ctx.flight) return;
		const flightClients = Object.values(ctx.flight.clients).flatMap((entity) => {
			if (!entity?.components.flightClient) return [];
			const client = entity.components.flightClient;
			const ship = ctx.ecs.getEntityById(client.shipId || -1);

			return {
				clientId: client.clientId,
				shipName: ship?.components.identity?.name,
				stationId: client.stationId,
			};
		});
		// Replace the flight with a new flight
		const flight = await startFlight(ctx, {
			flightName: ctx.flight.name,
			hasFlightDirector: ctx.flight.hasFlightDirector,
			mode: ctx.flight.mode,
			ships: ctx.flight.startInput.ships as any,
			missionId: ctx.flight.startInput.missionId,
			startingPoint: ctx.flight.startInput.startingPoint,
		});

		// Reset all of the flight clients state
		for (const client of Object.values(flightClients)) {
			const entity = new Entity();
			const { clientId, shipName, stationId } = client;
			const shipId = flight.ecs.componentCache
				.get("isShip")
				?.values()
				.find((ship) => ship.components.identity?.name === shipName)?.id;
			entity.addComponent("flightClient", {
				clientId,
				flightId: flight.name,
				shipId,
				stationId,
			});
			ctx.flight.ecs.addEntity(entity);
		}
		pubsub.publishAll();
		return ctx.flight;
	}),
	success: t.procedure
		.input(z.object({ reason: z.string().optional() }))
		.meta({
			action: () => {
				return {
					reason: {
						name: "Reason",
						helper: "The reason the flight succeeded.",
					},
				};
			},
		})
		.send(({ ctx, input }) => {
			if (ctx.flight) {
				ctx.flight.paused = true;
				ctx.flight.state = "success";
				ctx.flight.stateReason = input?.reason || "";
				pubsub.publish.flight.active();
			}
		}),
	failure: t.procedure
		.input(z.object({ reason: z.string().optional() }))
		.meta({ action: true })
		.send(({ ctx, input }) => {
			if (ctx.flight) {
				ctx.flight.paused = true;
				ctx.flight.state = "failure";
				ctx.flight.stateReason = input?.reason || "";
				pubsub.publish.flight.active();
			}
		}),
	uploadAsset: t.procedure
		.input(
			z.object({
				assetPath: z.string(),
				asset: z.instanceof(File),
			}),
		)
		.send(async ({ input, ctx }) => {
			if (!ctx.flight) throw new Error("Flight not found.");
			const assetPath = await ctx.uploadFile.call(ctx.flight, input.asset, input.assetPath);
			pubsub.publish.flight.assets();
			return { asset: assetPath };
		}),
});
