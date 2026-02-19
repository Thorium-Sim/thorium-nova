import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import type { isLongRangeMessage } from "@thorium/ecs-components/shipSystems";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { calculateShipMapPath } from "@thorium/utils/.server/ship/shipMapPathfinder";
import { type ECS, Entity } from "@thorium/utils/ecs";
import type { RNG } from "@thorium/utils/rng";
import { getObjectSystem } from "@thorium/utils/starmap/position";
import z from "zod";
import { createShipMapGraph } from "@thorium/utils/.server/ship/shipMapPathfinder";

import { lightYearToLightMinute } from "@thorium/utils/unitTypes";

const encodingSchema = z.union([
	z.object({
		type: z.literal("waves"),
		waveCount: z.number().optional(),
		hasPhase: z.boolean().optional(),
	}),
	z.object({
		type: z.literal("replacement"),
		includedLetters: z.number(),
	}),
	z.object({ type: z.literal("decoded") }),
]);

export const longRangeComm = t.router({
	addressBook: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["isLongRangeComm"],
			(entity) =>
				entity.components.isLongRangeComm && [
					{ shipId: entity.components.isShipSystem?.shipId || -1 },
				],
		)
		.request(({ input, ctx }) => {
			const lrcomm = getShipSystem(ctx.ecs, {
				systemType: "longRangeComm",
				shipId: input.shipId,
			});
			if (!lrcomm?.components.isLongRangeComm)
				throw new Error("Long Range Comm system not found");
			return lrcomm.components.isLongRangeComm.addressBook.map((m) => {
				let name = m.name;
				if (!name) {
					const entity = ctx.ecs.getEntityById(m.contactId);
					name = entity?.components.identity?.name || "Unknown";
				}
				return { id: m.contactId, name };
			});
		}),
	outgoingMessages: t.procedure
		.input(z.object({ shipId: z.number(), all: z.boolean().optional() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["isLongRangeMessage"],
			(entity) =>
				entity.components.isLongRangeMessage && [
					{ shipId: entity.components.isLongRangeMessage.senderId },
				],
		)
		.request(({ input, ctx }) => {
			const messages: (Pick<
				z.infer<typeof isLongRangeMessage>,
				"message" | "senderStation" | "state" | "destinationId"
			> & {
				id: number;
				destinationShipName: string;
			})[] = [];
			const lrcomm = getShipSystem(ctx.ecs, {
				systemType: "longRangeComm",
				shipId: input.shipId,
			});
			for (const message of ctx.ecs.componentCache.get("isLongRangeMessage") ||
				[]) {
				if (message.components.isLongRangeMessage?.senderId !== input.shipId)
					continue;
				if (
					!input.all &&
					!["draft", "pending", "sending"].includes(
						message.components.isLongRangeMessage.state,
					)
				)
					continue;
				const destinationId =
					message.components.isLongRangeMessage.destinationId;
				let destinationShipName =
					lrcomm.components.isLongRangeComm?.addressBook.find(
						(f) => f.contactId === destinationId,
					)?.name;
				if (!destinationShipName) {
					const destination = ctx.ecs.getEntityById(destinationId);
					destinationShipName =
						destination?.components.identity?.name || "Unknown";
				}
				messages.push({
					id: message.id,
					destinationShipName,
					message: message.components.isLongRangeMessage.message,
					destinationId: message.components.isLongRangeMessage.destinationId,
					senderStation: message.components.isLongRangeMessage.senderStation,
					state: message.components.isLongRangeMessage.state,
				});
			}

			return messages;
		}),
	incomingMessages: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["isLongRangeMessage"],
			(entity) =>
				entity.components.isLongRangeMessage && [
					{ shipId: entity.components.isLongRangeMessage.destinationId },
				],
		)
		.request(({ input, ctx }) => {
			const messages: (z.infer<typeof isLongRangeMessage> & {
				id: number;
				senderShipName: string;
				destinationShipName: string;
			})[] = [];
			const lrcomm = getShipSystem(ctx.ecs, {
				systemType: "longRangeComm",
				shipId: input.shipId,
			});
			for (const message of ctx.ecs.componentCache.get("isLongRangeMessage") ||
				[]) {
				if (
					message.components.isLongRangeMessage?.destinationId !==
						input.shipId ||
					!["sent", "intercepted"].includes(
						message.components.isLongRangeMessage.state,
					)
				)
					continue;
				const senderId = message.components.isLongRangeMessage.senderId;
				const destinationId =
					message.components.isLongRangeMessage.destinationId;
				let senderShipName =
					lrcomm.components.isLongRangeComm?.addressBook.find(
						(f) => f.contactId === senderId,
					)?.name;
				let destinationShipName =
					lrcomm.components.isLongRangeComm?.addressBook.find(
						(f) => f.contactId === destinationId,
					)?.name;
				if (!senderShipName) {
					const sender = ctx.ecs.getEntityById(senderId);
					senderShipName = sender?.components.identity?.name || "Unknown";
				}
				if (!destinationShipName) {
					const destination = ctx.ecs.getEntityById(destinationId);
					destinationShipName =
						destination?.components.identity?.name || "Unknown";
				}
				messages.push({
					id: message.id,
					senderShipName,
					destinationShipName,
					...message.components.isLongRangeMessage,
				});
			}

			return messages;
		}),
	addToAddressBook: t.procedure
		.meta({ action: true })
		.input(
			z.object({
				shipId: z.number(),
				contactId: z.number(),
				name: z.string().optional(),
				actions: z
					.object({
						params: z.string().array(),
						intent: z.string(),
						blocks: z.any().array(),
					})
					.array()
					.optional(),
			}),
		)
		.send(({ ctx, input }) => {
			if (input.shipId === input.contactId) return;

			const lrcomm = getShipSystem(ctx.ecs, {
				systemType: "longRangeComm",
				shipId: input.shipId,
			});
			lrcomm.updateComponent("isLongRangeComm", {
				addressBook: [
					...(lrcomm.components.isLongRangeComm?.addressBook || []),
					{
						contactId: input.contactId,
						actions: input.actions || [],
						name: input.name,
					},
				],
			});
		}),
	removeFromAddressBook: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				contactId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const lrcomm = getShipSystem(ctx.ecs, {
				systemType: "longRangeComm",
				shipId: input.shipId,
			});
			lrcomm.updateComponent("isLongRangeComm", {
				addressBook: (
					lrcomm.components.isLongRangeComm?.addressBook || []
				).filter((a) => a.contactId !== input.contactId),
			});
		}),
	composeMessage: t.procedure
		.input(
			z.object({
				senderId: z.number(),
				destinationId: z.number(),
				message: z.string(),
				state: z.enum(["pending", "sent"]).optional(),
				senderStation: z.string().optional(),
				encoding: encodingSchema,
			}),
		)
		.send(({ ctx, input }) => {
			const message = new Entity();

			message.addComponent("isLongRangeMessage", {
				destinationId: input.destinationId,
				senderId: input.senderId,
				message: input.message,
				state: input.state || "pending",
				timestamp: Date.now(),
				senderStation: input.senderStation,
				encoding: generateEncoding(input.encoding, ctx.ecs.rng),
			});
			ctx.ecs.addEntity(message);
			pubsub.publish.longRangeComm.outgoingMessages({ shipId: input.senderId });
		}),
	sendMessage: t.procedure
		.input(
			z.object({
				messageId: z.number(),
				satelliteId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const message = ctx.ecs.getEntityById(input.messageId);
			if (!message?.components.isLongRangeMessage)
				throw new Error("Invalid Long Range Message");
			const shipId = message.components.isLongRangeMessage.senderId;
			const ship = ctx.ecs.getEntityById(shipId);

			if (!ship) throw new Error("Invalid Long Range Message");
			const system = getObjectSystem(ship);
			const position = system?.components.position || ship.components.position;
			message.addComponent("position", { ...position });

			try {
				const nextNodeId = pickNextLongRangeMessageNode(
					ctx.ecs,
					input.satelliteId,
					message.components.isLongRangeMessage.destinationId,
					message.components.isLongRangeMessage.visitedNodeIds,
				);
				message.updateComponent("isLongRangeMessage", {
					nextNodeId,
					state: "sending",
				});
			} catch {
				message.removeComponent("position");
				message.updateComponent("isLongRangeMessage", { state: "undelivered" });
			} finally {
				pubsub.publish.longRangeComm.outgoingMessages({ shipId });
			}
		}),
});

const letters = "abcdefghijklmnopqrstuvwxyz1234567890";
function generateEncoding(
	encoding: z.infer<typeof encodingSchema>,
	rng: RNG,
): z.infer<typeof isLongRangeMessage>["encoding"] {
	switch (encoding.type) {
		case "replacement": {
			let requiredLetterMap = "";
			const requiredLetters = letters.split("");
			while (requiredLetters.length > 0) {
				const letterIndex = Math.trunc(
					rng.nextAsPercentage() * requiredLetters.length,
				);
				const letter = requiredLetters.splice(letterIndex, 1);
				requiredLetterMap = `${requiredLetterMap}${letter.join("")}`;
			}
			let letterMap = letters;
			for (let i = 0; i < encoding.includedLetters; i++) {
				const splitLetters = letterMap.split("");
				const correctLetterIndex = Math.trunc(
					rng.nextAsPercentage() * splitLetters.length,
				);
				splitLetters[correctLetterIndex] =
					requiredLetterMap[correctLetterIndex];
				letterMap = splitLetters.join("");
			}
			return { type: "replacement", requiredLetterMap, letterMap };
		}
		case "waves": {
			const waves: Extract<
				z.infer<typeof isLongRangeMessage>["encoding"],
				{ type: "waves" }
			>["waves"] = [];
			for (let i = 0; i < (encoding.waveCount || 1); i++) {
				waves.push({
					amplitude: 10,
					frequency: 5,
					phase: 0,
					requiredAmplitude: rng.nextAsPercentage() * 18 + 2,
					requiredFrequency: rng.nextAsPercentage() * 9 + 1,
					requiredPhase: encoding.hasPhase
						? rng.nextAsPercentage() * Math.PI
						: 0,
				});
			}
			return { type: "waves", waves };
		}
		default:
			return { type: "decoded" };
	}
}

export function pickNextLongRangeMessageNode(
	ecs: ECS,
	startId: number,
	destinationId: number,
	visitedNodeIds: number[],
) {
	// Figure out the closest node to the message's position
	const satellites = Array.from(
		ecs.componentCache.get("isCommSatellite") || [],
	);
	const destination = ecs.getEntityById(destinationId);
	if (!destination)
		throw new Error("Unable to send long range message: Invalid Destination");
	const closestEndNode = findClosestSatellite(satellites, destination);
	if (!closestEndNode)
		throw new Error(
			"Unable to send long range message: Unable to find comm satellite route",
		);

	// Create the graph and determine the path
	const graph = generateSatelliteGraph(satellites);
	const nodePath = calculateShipMapPath(graph, startId, closestEndNode.id);
	if (!nodePath)
		throw new Error(
			"Unable to send long range message: Unable to find comm satellite route",
		);

	for (const nodeId of nodePath) {
		if (visitedNodeIds.includes(nodeId)) {
			continue;
		}
		return nodeId;
	}

	return nodePath.at(-1)!;
}

export function generateSatelliteGraph(satellites: Entity[]) {
	const nodes: {
		id: number;
		radius: number;
		x: number;
		y: number;
		z: number;
		priorityMultiplier: number;
	}[] = [];
	const edgesMap = new Map<string, [number, number]>();
	for (const satellite of satellites) {
		const system = getObjectSystem(satellite);
		const position =
			system?.components.position || satellite.components.position;
		if (!position) continue;
		nodes.push({
			id: satellite.id,
			x: position.x,
			y: position.y,
			z: position.z,
			radius: lightYearToLightMinute(
				satellite.components.isCommSatellite?.radius || 0,
			),
			// We heavily prioritize player ships so they can intercept messages
			priorityMultiplier: satellite.components.isPlayerShip ? 0.5 : 1,
		});
	}
	for (const node of nodes) {
		for (const node2 of nodes) {
			if (node === node2) continue;
			const key = [node.id, node2.id].sort().join(",");
			if (edgesMap.has(key)) continue;
			const distance = Math.hypot(
				node.x - node2.x,
				node.y - node2.y,
				node.z - node2.z,
			);
			if (distance <= node.radius || distance <= node2.radius) {
				edgesMap.set(key, [node.id, node2.id]);
			}
		}
	}

	return createShipMapGraph(
		Array.from(edgesMap.values()).map((e) => ({ from: e[0], to: e[1] })),
		nodes,
	);
}

export function findClosestSatellite(
	nodes: Entity[],
	object: Entity,
	useRange?: boolean,
): { distance: number; id: number } | null {
	const objectSystem = getObjectSystem(object);
	const objectPosition =
		objectSystem?.components.position || object.components.position;

	if (!objectPosition) return null;
	let minDistance: { distance: number; id: number } = {
		distance: Number.POSITIVE_INFINITY,
		id: -1,
	};
	for (const node of nodes) {
		const system = getObjectSystem(node);
		const position = system?.components.position || node.components.position;
		if (!position) continue;

		const distance = Math.hypot(
			objectPosition.x - position.x,
			objectPosition.y - position.y,
			objectPosition.z - position.z,
		);
		if (useRange) {
			const range = node.components.isCommSatellite?.radius;
			if (!range) continue;
			if (distance > lightYearToLightMinute(range)) continue;
		}

		if (distance < minDistance.distance) {
			minDistance = { distance, id: node.id };
		}
	}

	return !minDistance.id ? null : minDistance;
}
