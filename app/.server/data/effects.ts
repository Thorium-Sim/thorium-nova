import {
	type EffectPayload,
	effectConfig,
	effectOptions,
	notBridgeStation,
} from "@thorium/utils/flags/effects";
import type { SoundEffect } from "@thorium/ecs-components/soundEffect";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { z } from "zod";
import type { position as positionComponent } from "@thorium/ecs-components/position";

type SoundPayload =
	| { type: "sound"; entityId: number; sound: SoundEffect & { id: string } }
	| { type: "cancelLooping"; entityId: number; soundId: string }
	| { type: "stop"; entityId: number; soundId: string }
	| { type: "stopAll" };

export const effects = t.router({
	sub: t.procedure
		.input(z.object({ clientId: z.string() }))
		.filter((payload: EffectPayload | null, { ctx, input: { clientId } }) => {
			if (!payload) return true;

			if (payload.clientId !== clientId) {
				const flightClient = ctx.getFlightClient(clientId);
				if (flightClient?.shipId !== payload.shipId) return false;

				switch (payload.station) {
					case "all":
						break;
					case "bridge":
						if (
							!flightClient?.stationId ||
							notBridgeStation.includes(flightClient.stationId)
						)
							return false;
						break;
					default:
						if (flightClient.stationId !== payload.station) return false;
				}
			}
			return true;
		})
		.request(({ publish }) => {
			if (!publish) return null;

			return { effect: publish.effect, config: publish.config };
		}),
	sounds: t.procedure
		.input(z.object({ clientId: z.string() }))
		.filter((payload: SoundPayload | null, { ctx, input: { clientId } }) => {
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
				sound = payload.sound;
			}
			const entity = ctx.flight?.ecs.getEntityById(payload.entityId);
			if (payload.type === "cancelLooping" || payload.type === "stop") {
				if (!entity) return false;
				sound =
					entity.components.soundEffects?.looping?.find(
						(s) => s.id === payload.soundId,
					) || null;
			}

			if (!sound) return false;

			const flightClient = ctx.getFlightClient(clientId);
			const ship = ctx.ecs.getEntityById(flightClient?.shipId || -1);
			return matchSound(
				sound,
				clientId,
				flightClient?.shipId,
				flightClient?.stationId,
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
		.filter(
			(
				publish: { shipId?: number; stationId?: string },
				{ ctx, input: { clientId } },
			) => {
				const shipId = ctx.getFlightClient(clientId)?.shipId;
				if (publish && publish.shipId !== shipId) return false;
				return true;
			},
		)
		.request(({ ctx, input: { clientId } }) => {
			const loopingSounds: SoundEffect[] = [];
			const flightClient = ctx.getFlightClient(clientId);
			const ship = ctx.ecs.getEntityById(flightClient?.shipId || -1);
			ctx.flight?.ecs.componentCache.get("soundEffects")?.forEach((entity) =>
				entity.components.soundEffects?.looping.forEach((sound) => {
					if (
						matchSound(
							sound,
							clientId,
							flightClient?.shipId,
							flightClient?.stationId,
							ship?.components.position,
						)
					) {
						loopingSounds.push(sound);
					}
				}),
			);
		}),
	trigger: t.procedure
		.meta({ action: true, event: true })
		.input(
			z.object({
				effect: effectOptions,
				config: effectConfig,
				shipId: z.number().optional(),
				station: z
					.union([z.literal("all"), z.literal("bridge"), z.string()])
					.optional(),
				clientId: z.string().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			const clientId = "clientId" in input ? input.clientId || null : null;
			const shipId = "shipId" in input ? input.shipId || null : null;
			let station: string | null = null;
			if ("shipId" in input) {
				const stationList =
					ctx.flight?.ecs.getEntityById(shipId ?? -1)?.components
						.stationComplement?.stations || [];

				station =
					("shipId" in input
						? input.station
						: randomFromList(stationList)?.name) || null;
			}
			const payload = {
				effect: input.effect,
				config: input.config,
				station,
				shipId,
				clientId,
			};
			// TODO: Properly handle all of the effects that are not handled client-side, such as
			// offline card transitions.
			pubsub.publish.effects.sub(payload);
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
