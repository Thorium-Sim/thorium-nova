import {
	type EffectPayload,
	effectOptions,
	notBridgeStation,
} from "@thorium/utils/flags/effects";
import type { SoundEffect } from "@thorium/ecs-components/soundEffect";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import z from "zod";
import type { position as positionComponent } from "@thorium/ecs-components/position";
import { sound } from "@thorium/ecs-components/sound";
import type { DataContext } from "@thorium/.server/DataContext";
import { playServerSound } from "@thorium/utils/.server/playRangedSound";
import type { ECS } from "@thorium/utils/ecs";
import { applyCardHighlight } from "@thorium/utils/.server/applyCardHighlight";

type SoundPayload =
	| { type: "sound"; entityId: number; sound: SoundEffect & { id: string } }
	| { type: "cancelLooping"; entityId: number; soundId: string }
	| { type: "stop"; entityId: number; soundId: string }
	| { type: "stopAll" };

const stationOrClient = z.union([
	z.object({ clientId: z.string() }),
	z.object({
		shipId: z.number(),
		station: z
			.union([
				z.literal("all"),
				z.literal("bridge"),
				z.literal("random"),
				z.string(),
			])
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
				return (
					payload.clientId === clientId || payload.clientId === client?.name
				);
			}

			if (clientData?.shipId !== payload.shipId) return false;

			switch (payload.station) {
				case "all":
					break;
				case "bridge":
					if (
						!clientData?.stationId ||
						notBridgeStation.includes(clientData.stationId)
					)
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
				if (
					!payload.sound.stations &&
					!payload.sound.clients &&
					!clientSettings.soundPlayer
				) {
					return false;
				}
				sound = payload.sound;
			}
			const entity = ctx.flight?.ecs.getEntityById(payload.entityId);
			if (payload.type === "cancelLooping" || payload.type === "stop") {
				if (!entity) return false;
				sound =
					entity.components.soundEffects?.looping?.find(
						(s) => s.id === payload.soundId,
					) || null;

				entity.updateComponent("soundEffects", {
					looping:
						entity.components.soundEffects?.looping.filter(
							(s) => s.key !== sound?.key,
						) || [],
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
		.filter(
			(
				publish: { shipId?: number; stationId?: string },
				{ ctx, input: { clientId } },
			) => {
				const shipId =
					ctx.getFlightClient(clientId)?.components.flightClient?.shipId;
				if (publish && publish.shipId !== shipId) return false;
				return true;
			},
		)
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
	playSound: t.procedure
		.meta({
			action: (ctx: DataContext) => ({
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
		.input(
			z.object({
				shipId: z.number(),
				station: z.union([z.string(), z.string().array()]).optional(),
				sound,
			}),
		)
		.send(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) return;
			playServerSound(
				ship,
				input.sound,
				Array.isArray(input.station)
					? input.station
					: input.station
						? [input.station]
						: undefined,
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
							station: z
								.union([z.literal("all"), z.literal("bridge"), z.string()])
								.optional(),
						}),
					]),
				),
		)
		.send(({ ctx, input }) => {
			// TODO: Properly handle all of the effects that are not handled client-side, such as
			// offline card transitions.
			if ("shipId" in input) {
				const stationList =
					ctx.flight?.ecs.getEntityById(input.shipId)?.components
						.stationComplement?.stations || [];

				const station =
					input.station === "random"
						? randomFromList(stationList)?.name
						: input.station;

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
	notify: t.procedure
		.meta({ action: true })
		.input(
			z
				.object({
					title: z.string(),
					body: z.string().optional(),
					duration: z.coerce.number().optional(),
					color: z.enum(["info", "success", "warning", "error", "notice"]),
					/** Add a highlight to the indicated cards, if they're present */
					cards: z.string().array().optional(),
				})
				.and(stationOrClient),
		)
		.send(({ ctx, input }) => {
			if ("clientId" in input) {
				const { clientId, ...notification } = input;
				pubsub.publish.effects.sub({
					effect: {
						type: "message",
						...notification,
						action: { type: "cardChange", cards: input.cards || [] },
					},
					clientId,
				});

				// Add the card highlight to this client's station
				const flightClient = ctx.getFlightClient(input.clientId);
				applyCardHighlight(
					ctx.ecs,
					flightClient?.components.flightClient?.shipId || -1,
					flightClient?.components.flightClient?.stationId,
					input.cards,
				);

				pubsub.publish.station.get({ clientId });
			} else {
				const { shipId, station, ...notification } = input;

				pubsub.publish.effects.sub({
					effect: {
						type: "message",
						...notification,
						action: { type: "cardChange", cards: input.cards || [] },
					},
					shipId,
					station,
				});
				// Add the card highlight
				applyCardHighlight(ctx.ecs, input.shipId, input.station, input.cards);
				// Find all clients assigned this station
				for (const client of ctx.ecs.componentCache.get("flightClient") || []) {
					const flightClient = client.components.flightClient;
					if (
						flightClient &&
						flightClient.shipId === shipId &&
						flightClient.stationId === station
					) {
						pubsub.publish.station.get({ clientId: flightClient.clientId });
					}
				}
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
		sound.stations?.some(
			(s) =>
				s.shipId === shipId! && (!s.stationId || s.stationId === stationId),
		)
	)
		return true;

	if (sound.range) {
		const position = sound.range.position;
		if (!shipPosition || shipPosition.parentId !== position.parentId)
			return false;

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
