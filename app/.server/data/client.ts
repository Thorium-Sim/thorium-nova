import type TrainingPlugin from "@thorium/.server/classes/Plugins/Training";
import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { spawnTimeline } from "@thorium/.server/spawners/timeline";
import type { TrainingVariables } from "@thorium/routes/config/trainings/trainingAvailableVariables";
import { staticStations } from "@thorium/routes/flight/staticStations";
import { applyCardHighlight } from "@thorium/utils/.server/applyCardHighlight";
import { triggerStep } from "@thorium/utils/.server/evaluateEntityQuery";
import { selectAvailableTimelines } from "@thorium/utils/.server/executeBlocks";
import type { Entity } from "@thorium/utils/ecs";
import MarkdownIt from "markdown-it";
import z from "zod";
const md = MarkdownIt();

const clientSettings = z.object({
	soundPlayer: z.boolean(),
	ambiancePlayer: z.boolean(),
	musicPlayer: z.boolean(),
	dialoguePlayer: z.boolean(),
});

export type ClientSettings = z.infer<typeof clientSettings>;

export const client = t.router({
	get: t.procedure
		.input(z.object({ clientId: z.string() }))
		.filter((publish: { clientId: string } | null, { input }) => {
			if (!publish) return true;
			if (publish.clientId === input.clientId) return true;
			return false;
		})
		.autoPublish(["flightClient"], (entity) =>
			entity.components.flightClient
				? { clientId: entity.components.flightClient?.clientId }
				: null,
		)
		.request(({ ctx, input }) => {
			const { id, name, connected, settings } = ctx.server.clients[input.clientId];
			const {
				officersLog: _,
				clientId: _id,
				...flightClient
			} = ctx.getFlightClient(input.clientId)?.components.flightClient || {};
			return { id, name, connected, settings, ...flightClient };
		}),
	all: t.procedure
		.autoPublish(["flightClient"], () => null)
		.request(({ ctx }) => {
			const serverClients = Object.values(ctx.server.clients);
			const clients = serverClients
				.map((client) => {
					const flightClient = ctx.getFlightClient(client.id);
					return {
						name: client.name,
						connected: client.connected,
						settings: client.settings,
						...flightClient?.components.flightClient!,
					};
				})
				.filter((client) => client.connected);
			return clients;
		}),
	setName: t.procedure
		.input(z.object({ clientId: z.string(), name: z.string().min(2) }))
		.send(({ ctx, input }) => {
			const client = ctx.getClient(input.clientId);
			client.name = input.name;
			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId: client.id });

			return { clientId: client.id, name: client.name };
		}),
	setStation: t.procedure
		.input(
			z.union([
				z.object({
					shipId: z.number(),
					stationId: z.string(),
					clientId: z.string(),
				}),
				z.object({ shipId: z.null(), clientId: z.string() }),
			]),
		)
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (!flightClient) {
				throw new Error("No flight has been started.");
			}

			// If shipId is null, we're removing ourselves from the flight.
			if (input.shipId === null) {
				flightClient.updateComponent("flightClient", {
					stationId: null,
					shipId: null,
				});
				const clientId = flightClient.components.flightClient!.clientId;
				pubsub.publish.client.all();
				pubsub.publish.client.get({ clientId });
				pubsub.publish.station.get({ clientId });
				pubsub.publish.theme.get({ clientId });
				pubsub.publish.ship.get({
					clientId,
				});
				pubsub.publish.ship.get({
					shipId: flightClient.components.flightClient?.shipId || -1,
				});
				return flightClient;
			}
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship?.components.isShip) {
				throw new Error("No ship with that ID exists.");
			}
			const station = [
				...staticStations,
				...(ship.components.stationComplement?.stations || []),
			].find((station) => station.name === input.stationId);

			if (!station) {
				throw new Error("No station with that ID exists.");
			}

			flightClient.updateComponent("flightClient", {
				stationId: input.stationId,
				shipId: input.shipId,
			});

			const clientId = flightClient.components.flightClient!.clientId;

			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId });
			pubsub.publish.station.get({ clientId });
			pubsub.publish.theme.get({ clientId });
			pubsub.publish.ship.get({ clientId });
			pubsub.publish.ship.player({ shipId: input.shipId });
			pubsub.publish.ship.get({
				shipId: input.shipId,
			});
			return flightClient;
		}),
	setCard: t.procedure
		.meta({ event: true, action: true })
		.input(
			z.object({
				clientId: z.string().optional(),
				shipId: z.number().optional(),
				station: z.string().optional(),
				card: z.string(),
			}),
		)
		.output(
			z.object({
				card: z.string(),
				clientId: z.string().nullish(),
				station: z.string().nullish(),
				shipId: z.number().nullish(),
			}),
		)
		.send(({ ctx, input }) => {
			const flightClient = getFlightClient(ctx, input);
			flightClient.updateComponent("flightClient", { currentCard: input.card });

			// Turn off the highlight for this card
			applyCardHighlight(
				ctx.ecs,
				flightClient.components.flightClient?.shipId || -1,
				flightClient.components.flightClient?.stationId,
				[input.card],
				false,
			);

			const clientId = flightClient.components.flightClient?.clientId || "";
			pubsub.publish.client.all();
			pubsub.publish.client.get({
				clientId,
			});
			pubsub.publish.station.get({
				clientId,
			});
			return {
				card: input.card,
				clientId,
				station: flightClient.components.flightClient?.stationId,
				shipId: flightClient.components.flightClient?.shipId,
			};
		}),
	setSettings: t.procedure
		.input(z.object({ clientId: z.string(), settings: clientSettings }))
		.send(({ ctx, input }) => {
			const client = ctx.getClient(input.clientId);

			client.settings = input.settings;
			pubsub.publish.client.all();
			pubsub.publish.client.get({
				clientId: input.clientId,
			});
		}),
	startTraining: t.procedure
		.input(z.object({ clientId: z.string() }))
		.meta({ action: true })
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight has not started.");
			const flightClient = ctx.getFlightClient(input.clientId);
			if (!flightClient?.components.flightClient) throw new Error("Invalid flight client");
			const { shipId, stationId } = flightClient.components.flightClient;
			if (!shipId) throw new Error("Invalid flight client");
			const ship = ctx.ecs.getEntityById(shipId);

			// Find a training that is suitable for this client and kick it off
			const trainingVariables = {
				clientId: input.clientId,
				shipId,
				station: stationId,
				stationComplement: ship?.components.stationComplement?.name || "",
			} satisfies TrainingVariables;

			const timelines = await selectAvailableTimelines(
				ctx.ecs,
				ctx.server.plugins.reduce((acc: TrainingPlugin[], p) => {
					if (ctx.flight?.pluginIds.includes(p.id)) {
						acc.push(...p.aspects.trainings);
					}
					return acc;
				}, []),
				ctx.flight?.mode,
				trainingVariables,
			);
			const timeline = timelines[0];
			if (!timeline) throw new Error("No training available.");

			// This automatically adds the timeline entity to ECS
			const training = spawnTimeline(timeline, (entity) => ctx.ecs.addEntity(entity), shipId);

			training.addComponent("variables", {
				variables: [
					{ name: "clientId", type: "any", value: trainingVariables.clientId },
					{ name: "shipId", type: "any", value: trainingVariables.shipId },
					{ name: "station", type: "any", value: trainingVariables.station },
					{
						name: "stationComplement",
						type: "any",
						value: trainingVariables.stationComplement,
					},
				],
			});
			flightClient.updateComponent("flightClient", {
				training: {
					text: "",
					allowAdvance: false,
					...flightClient.components.flightClient?.training,
					timelineId: training.id,
				},
			});
			// Trigger the first step
			await triggerStep(
				ctx.flight.ecs.getEntityById(training.components.isTimeline?.steps[0] || -1)!,
			);
			pubsub.publish.client.all();
			pubsub.publish.client.get({
				clientId: flightClient.components.flightClient?.clientId || "",
			});
			pubsub.publish.flight.timelines();
		}),
	setTraining: t.procedure
		.input(
			z.object({
				clientId: z.string().optional(),
				station: z.string().optional(),
				shipId: z.number().optional(),
				text: z.string(),
				card: z.string().optional(),
				selector: z.union([z.string().array(), z.string()]).optional(),
				mediaUrl: z.string().optional(),
				allowAdvance: z.boolean().optional(),
				timelineId: z.number().optional(),
			}),
		)
		.meta({
			action: () => ({
				text: {
					name: "Training Text",
					type: "textarea",
					helper: "The text the crew member will see to instruct them.",
					inputProps: { rows: 5 },
				},
				card: {
					helper: "Which card the training will automatically move the crew to.",
				},
				selector: {
					type: "tags",
					inputProps: {
						omitChars: [","],
						placholder: "Type and press return to add a selector",
					},
					helper:
						"A CSS selector to the element you would like to highlight during this training step. Omit to center the training text and have no highlight.",
				},
				allowAdvance: {
					type: "checkbox",
					helper: "Whether the crew member can advance the training on their own.",
				},
				timelineId: {
					helper: "The timeline that will be advanced if allow advance is active.",
				},
			}),
		})
		.send(({ ctx, input }) => {
			const flightClient = getFlightClient(ctx, input);
			const selector = typeof input.selector === "string" ? [input.selector] : input.selector;
			flightClient.updateComponent("flightClient", {
				training:
					input.text === null
						? null
						: {
								...flightClient.components.flightClient?.training,
								text: md.renderInline(input.text),
								card: input.card,
								mediaUrl: input.mediaUrl,
								selector,
								allowAdvance: input.allowAdvance || false,
								...(input.timelineId ? { timelineId: input.timelineId } : null),
							},
			});

			pubsub.publish.client.all();
			pubsub.publish.client.get({
				clientId: flightClient.components.flightClient?.clientId || "",
			});
		}),
	login: t.procedure
		.meta({ event: true })
		.input(z.object({ clientId: z.string(), name: z.string() }))
		.output(z.object({ clientId: z.string(), name: z.string() }))
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (!flightClient) {
				throw new Error("Flight Client not found.");
			}
			flightClient.updateComponent("flightClient", {
				loginName: input.name,
			});

			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId: input.clientId });
			return { clientId: input.clientId, name: input.name };
		}),
	logout: t.procedure.input(z.object({ clientId: z.string() })).send(({ ctx, input }) => {
		const flightClient = ctx.getFlightClient(input.clientId);
		if (flightClient) {
			flightClient.updateComponent("flightClient", {
				loginName: "",
			});

			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId: input.clientId });
		}
		return null;
	}),
	testStation: t.procedure
		.input(z.object({ clientId: z.string(), component: z.string().nullable() }))
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (!flightClient || !ctx.flight) {
				throw new Error("No flight has been started.");
			}
			const component = input.component;
			if (component) {
				flightClient.updateComponent("flightClient", {
					stationOverride: {
						name: "Test Station",
						cards: [
							{
								name: component,
								component,
							},
						],
						widgets: [],
						messageGroups: [],
					},
					shipId: ctx.flight.playerShips[0].id,
					loginName: "Test User",
				});
				pubsub.publish.ship.get({ shipId: ctx.flight.playerShips[0].id });
				pubsub.publish.ship.player({ shipId: ctx.flight.playerShips[0].id });
			} else {
				flightClient.updateComponent("flightClient", {
					stationOverride: null,
					shipId: null,
					loginName: "",
				});
			}
			pubsub.publish.client.get({ clientId: input.clientId });
			pubsub.publish.station.get({ clientId: input.clientId });
			pubsub.publish.theme.get({ clientId: input.clientId });
		}),
});

function getFlightClient(
	ctx: DataContext,
	input: { clientId?: string; station?: string; shipId?: number },
) {
	let flightClient: Entity | null = null;
	if (input.clientId) {
		flightClient = ctx.getFlightClient(input.clientId);
	} else {
		for (const entity of ctx.ecs.componentCache.get("flightClient") || []) {
			if (
				entity.components.flightClient?.stationId === input.station &&
				entity.components.flightClient?.shipId === input.shipId
			) {
				flightClient = entity;
				break;
			}
		}
	}
	if (!flightClient) throw new Error("Flight client not found");
	return flightClient;
}
