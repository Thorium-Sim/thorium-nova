import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import type { position as positionComponent } from "@thorium/ecs-components/position";
import { sound } from "@thorium/ecs-components/sound";
import type { SoundEffect } from "@thorium/ecs-components/soundEffect";
import { timelineBlock } from "@thorium/ecs-components/timelineBlocks";
import { applyCardHighlight } from "@thorium/utils/.server/applyCardHighlight";
import { playServerSound } from "@thorium/utils/.server/playRangedSound";
import { Entity } from "@thorium/utils/ecs";
import { type EffectPayload, effectOptions, notBridgeStation } from "@thorium/utils/flags/effects";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import z from "zod";

type SoundPayload =
	| { type: "sound"; entityId: number; sound: SoundEffect & { id: string } }
	| { type: "cancelLooping"; entityId: number; soundId: string }
	| { type: "stop"; entityId: number; soundId: string }
	| { type: "stopAll" };

type DialoguePayload =
	| {
			type: "dialogue";
			conversationId: number;
			audioFilepath: string;
			shipId: number;
	  }
	| { type: "stopDialogue"; conversationId: number; shipId: number };

const stationOrClient = z.union([
	z.object({ clientName: z.string() }),
	z.object({
		shipId: z.number(),
		station: z
			.union([z.literal("all"), z.literal("bridge"), z.literal("random"), z.string()])
			.optional(),
	}),
]);

export const effects = t.router({
	sub: t.procedure
		.input(z.object({ clientId: z.string() }))
		// This request can only be triggered by a publish.
		.autoPublish([], () => null)
		.filter((payload: EffectPayload | null, { ctx, input: { clientId } }) => {
			if (!payload) return true;
			const flightClient = ctx.getFlightClient(clientId);
			const client = ctx.getClient(clientId);
			const clientData = flightClient?.components.flightClient;

			if ("clientId" in payload) {
				return payload.clientId === clientId || payload.clientId === client?.name;
			}

			if (clientData?.shipId !== payload.shipId) return false;

			switch (payload.station) {
				case "all":
					break;
				case "bridge":
					if (!clientData?.stationId || notBridgeStation.includes(clientData.stationId))
						return false;
					break;
				default:
					if (clientData.stationId !== payload.station) return false;
			}

			return true;
		})
		.request(({ publish }) => {
			if (!publish) return null;
			return { effect: publish.effect };
		}),
	events: t.procedure
		.input(z.object({ clientId: z.string() }))
		// This request can only be triggered by a publish.
		.autoPublish([], () => null)
		.filter(
			(
				payload: { clientId: string; name: string; payload: any } | null,
				{ ctx, input: { clientId } },
			) => {
				if (!payload) return true;
				const client = ctx.getClient(clientId);

				return payload.clientId === clientId || payload.clientId === client?.name;
			},
		)
		.request(({ publish }) => {
			if (!publish) return null;
			return { name: publish.name, payload: publish.payload };
		}),
	sounds: t.procedure
		.input(z.object({ clientId: z.string() }))
		// This request can only be triggered by a publish.
		.autoPublish([], () => null)
		.filter((payload: SoundPayload | null, { ctx, input: { clientId } }) => {
			const clientSettings = ctx.getClient(clientId)?.settings || {};
			/**
			 * Logic for filtering out sound payloads
			 * - If the sound has `clients`, it only plays on those clients
			 * - If the sound has `stations` and `ship`, it only plays on those stations
			 * - If the sound has `ship`, it plays on all stations on that ships
			 * - If the sound has `range`, it determines the position of the sound in space,
			 *      then finds all simulators within that range and plays the sound on all stations
			 *      on those ships
			 * - Otherwise the sound doesn't play
			 */
			if (!payload) return false;
			if (payload.type === "stopAll") return true;

			let sound: SoundEffect | null = null;

			if (payload.type === "sound") {
				// Cancel starting a new sound if the the sound isn't targeted to a specific station or client,
				// and if the client has sound effects turned off
				if (!payload.sound.stations && !payload.sound.clients && !clientSettings.soundPlayer) {
					return false;
				}
				sound = payload.sound;
			}
			const entity = ctx.flight?.ecs.getEntityById(payload.entityId);
			if (payload.type === "cancelLooping" || payload.type === "stop") {
				if (!entity) return false;
				sound =
					entity.components.soundEffects?.looping?.find((s) => s.id === payload.soundId) || null;

				entity.updateComponent("soundEffects", {
					looping:
						entity.components.soundEffects?.looping.filter((s) => s.key !== sound?.key) || [],
				});
			}

			if (!sound) return false;

			const flightClient = ctx.getFlightClient(clientId);
			const clientData = flightClient?.components.flightClient;
			const ship = ctx.ecs.getEntityById(clientData?.shipId || -1);
			return matchSound(
				sound,
				clientId,
				clientData?.shipId,
				clientData?.stationId,
				ship?.components.position,
			);
		})
		.request(({ publish }) => {
			if (!publish) return null;
			return publish;
		}),
	/** Sounds that generate ambiance
	 * - Basic ambiance which is applied by the ship itself
	 * - Reactors
	 * - Engines
	 * - Short Range Communications
	 * - Sensors
	 * - Sensor Scans
	 * - Internal Sensors
	 * - Shields
	 * - Tractor Beam
	 * - Stealth Field
	 * - Signal Jammer
	 */
	ambiance: t.procedure
		.input(z.object({ clientId: z.string() }))
		// This request can only be triggered by a publish.
		.autoPublish([], () => null)
		.filter((publish: { shipId?: number; stationId?: string }, { ctx, input: { clientId } }) => {
			const shipId = ctx.getFlightClient(clientId)?.components.flightClient?.shipId;
			if (publish && publish.shipId !== shipId) return false;
			return true;
		})
		.request(({ ctx, input: { clientId } }) => {
			const loopingSounds: SoundEffect[] = [];
			const flightClient = ctx.getFlightClient(clientId);
			const clientData = flightClient?.components.flightClient;
			const ship = ctx.ecs.getEntityById(clientData?.shipId || -1);
			ctx.flight?.ecs.componentCache.get("soundEffects")?.forEach((entity) =>
				entity.components.soundEffects?.looping.forEach((sound) => {
					if (
						matchSound(
							sound,
							clientId,
							clientData?.shipId,
							clientData?.stationId,
							ship?.components.position,
						)
					) {
						loopingSounds.push(sound);
					}
				}),
			);
		}),
	dialogue: t.procedure
		.input(z.object({ clientId: z.string() })) // This request can only be triggered by a publish.
		.autoPublish([], () => null)
		.filter((publish: DialoguePayload, { ctx, input: { clientId } }) => {
			const shipId = ctx.getFlightClient(clientId)?.components.flightClient?.shipId;
			const dialoguePlayer = ctx.getClient(clientId).settings.dialoguePlayer;
			if (!dialoguePlayer) return false;

			if (publish && publish.shipId !== shipId) return false;
			return true;
		})
		.request(({ publish }) => {
			return publish;
		}),
	playSound: t.procedure

		.input(
			z.object({
				shipId: z.number(),
				station: z.union([z.string(), z.string().array()]).optional(),
				sound,
			}),
		)
		.meta({
			action: () => ({
				sound: {
					name: "Sound Effect",
					type: "sound",
				},
				station: {
					name: "Station",
					type: "text",
					helper: "Leave blank to play on all stations.",
				},
			}),
			event: true,
		})
		.send(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) return;
			playServerSound(
				ship,
				input.sound,
				Array.isArray(input.station) ? input.station : input.station ? [input.station] : undefined,
			);
		}),
	trigger: t.procedure
		.meta({ action: true, event: true })
		.input(
			z
				.object({
					effect: effectOptions,
				})
				.and(
					z.union([
						z.object({ clientId: z.string() }),
						z.object({
							shipId: z.number(),
							station: z.union([z.literal("all"), z.literal("bridge"), z.string()]).optional(),
						}),
					]),
				),
		)
		.send(({ ctx, input }) => {
			// TODO: Properly handle all of the effects that are not handled client-side, such as
			// offline card transitions.
			if ("shipId" in input) {
				const stationList =
					ctx.flight?.ecs.getEntityById(input.shipId)?.components.stationComplement?.stations || [];

				const station =
					input.station === "random" ? randomFromList(stationList)?.name : input.station;

				pubsub.publish.effects.sub({
					effect: input.effect,
					station,
					shipId: input.shipId,
				});
			} else {
				pubsub.publish.effects.sub({
					effect: input.effect,
					clientId: input.clientId,
				});
			}
		}),
	sendClientEvent: t.procedure
		.input(z.object({ clientId: z.string(), name: z.string(), payload: z.coerce.string() }))
		.meta({ action: true })
		.send(({ input }) => {
			pubsub.publish.effects.events(input);
		}),
	notify: t.procedure

		.input(
			z
				.object({
					title: z.string(),
					body: z.string().optional(),
					duration: z.coerce.number().optional(),
					color: z.enum(["info", "success", "warning", "error", "notice"]),
					/** Add some actions underneath the notification. Disables the duration. */
					actions: z
						.object({ label: z.string(), blocks: timelineBlock.array() })
						.array()
						.optional(),
					/** Add a highlight to the indicated cards (by either component or card name), if they're present */
					cards: z.string().array().optional(),
				})
				.and(stationOrClient),
		)
		.meta({
			action: () => ({
				cards: {
					type: "tags",
					helper: "Add a highlight to the indicated cards, if they're present",
				},
				actions: { type: "labeledBlockList" },
			}),
		})
		.send(({ ctx, input }) => {
			const clientIds: string[] = [];
			if ("clientName" in input) {
				const clientId = ctx.server.getClientByName(input.clientName)?.id || "";
				clientIds.push(clientId);
			} else if ("shipId" in input) {
				let { shipId, station, cards } = input;
				if (!station) {
					// Find the station that matches the cards
					const { ship } = getShip({ ctx, shipId, station });
					for (const shipStation of ship?.components.stationComplement?.stations || []) {
						if (
							shipStation.cards.some((c) => cards?.includes(c.component) || cards?.includes(c.name))
						) {
							station = shipStation.name;
							break;
						}
					}
				}

				// Find the clients that are assigned to that station
				for (const client of ctx.ecs.componentCache.get("flightClient") || []) {
					const flightClient = client.components.flightClient;
					if (
						flightClient &&
						flightClient.shipId === shipId &&
						flightClient.stationId === station
					) {
						clientIds.push(flightClient.clientId);
					}
				}
			}

			for (const clientId of clientIds) {
				const card = getCardForStation({ ctx, cards: input.cards, ...input });
				const actions = input.actions
					? input.actions.map((a) => ({
							label: a.label,
							type: "blocks" as const,
							blocks: a.blocks,
							localVariables: ctx.localVariables,
						}))
					: card
						? [
								{
									blocks: [
										{
											id: "card-change",
											type: "Action" as const,
											action: "client.setCard",
											values: { card, clientId },
										},
									],
								},
							]
						: undefined;

				const notificationEntity = new Entity();
				notificationEntity.addComponent("identity", {
					name: input.title,
					description: input.body,
				});
				notificationEntity.addComponent("notification", {
					clientId,
					color: input.color,
					actions,
				});
				// Don't include the timer if there are buttons to click on the notification
				if (!actions || !actions?.some((a) => "label" in a && a.label)) {
					notificationEntity.addComponent("timer", {
						label: input.title,
						remainingDurationMs: input.duration || 5000,
						hidden: true,
						paused: false,
						completeBlocks: [
							{
								type: "Action",
								id: "clear",
								action: "effects.clearNotification",
								values: { notificationId: notificationEntity.id },
							},
						],
					});
				}
				ctx.ecs.addEntity(notificationEntity);

				// Add the card highlight
				const flightClient = ctx.getFlightClient(clientId)?.components.flightClient;
				if (flightClient) {
					const { shipId, stationId } = flightClient;
					if (shipId && stationId) {
						applyCardHighlight(ctx.ecs, shipId, stationId, input.cards);
					}
				}
				// Find all clients assigned this station
				pubsub.publish.station.get({ clientId });
				pubsub.publish.client.notifications({ clientId });
			}
		}),
	clearNotification: t.procedure
		.input(z.object({ notificationId: z.number() }))
		.send(({ ctx, input }) => {
			const entity = ctx.ecs.getEntityById(input.notificationId);
			if (!entity) return;
			const clientId = entity.components.notification?.clientId;
			ctx.ecs.removeEntity(entity);
			if (clientId) {
				pubsub.publish.client.notifications({ clientId });
			}
		}),
});

function matchSound(
	sound: SoundEffect,
	clientId?: string,
	shipId?: number | null,
	stationId?: string | null,
	shipPosition?: z.infer<typeof positionComponent>,
) {
	if (clientId && sound.clients?.includes(clientId)) return true;
	if (
		sound.stations?.some((s) => s.shipId === shipId! && (!s.stationId || s.stationId === stationId))
	)
		return true;

	if (sound.range) {
		const position = sound.range.position;
		if (!shipPosition || shipPosition.parentId !== position.parentId) return false;

		const distance = Math.hypot(
			shipPosition.x - position.x,
			shipPosition.y - position.y,
			shipPosition.z - position.z,
		);
		// Sound attenuation will be calculated on the client.
		if (distance > sound.range.distance) return false;
		return true;
	}
	return false;
}

function getShip({
	ctx,
	clientId,
	shipId,
	station,
}: {
	ctx: DataContext;
	cards?: string[];
	shipId?: number;
	station?: string;
	clientId?: string;
}) {
	if (clientId) {
		const flightClient = ctx.getFlightClient(clientId);
		station = station || flightClient?.components.flightClient?.stationId || undefined;
		shipId = flightClient?.components.flightClient?.shipId || shipId;
	}
	const ship = ctx.ecs.getEntityById(shipId || -1);

	return { ship, station };
}

function getCardForStation({
	ctx,
	cards,
	clientId,
	shipId,
	station: inputStation,
}: {
	ctx: DataContext;
	cards?: string[];
	shipId?: number;
	station?: string;
	clientId?: string;
}) {
	if (!cards) return null;

	const { ship, station } = getShip({ ctx, clientId, shipId, station: inputStation });
	if (!ship || !station) return null;

	const stationObj = ship.components.stationComplement?.stations.find((s) => s.name === station);
	if (!stationObj) return null;

	for (let stationCard of stationObj.cards) {
		if (cards.includes(stationCard.component) || cards.includes(stationCard.name))
			return stationCard.component;
	}
	return null;
}
