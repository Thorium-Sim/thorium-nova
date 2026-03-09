import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import type { isLongRangeMessage } from "@thorium/ecs-components/shipSystems";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { calculateShipMapPath } from "@thorium/utils/.server/ship/shipMapPathfinder";
import { type ECS, Entity } from "@thorium/utils/ecs";
import type { RNG } from "@thorium/utils/rng";
import {
	getCompletePositionFromOrbit,
	getObjectSystem,
} from "@thorium/utils/starmap/position";
import z from "zod";
import { createShipMapGraph } from "@thorium/utils/.server/ship/shipMapPathfinder";

import {
	lightMinuteToLightYear,
	lightYearToLightMinute,
} from "@thorium/utils/unitTypes";

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
	z.object({ type: z.literal("rotation"), rotation: z.number() }),
	z.object({ type: z.literal("decoded") }),
]);

export const longRangeComm = t.router({
	get: t.procedure
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
				throw new Error("No Long Range Comm System");
			return {
				id: lrcomm.id,
				requiredPower: lrcomm.components.power?.powerLevels[0] || 0,
				maxSafePower: lrcomm.components.power?.powerLevels.at(-1) || 1,
				currentPower: lrcomm.components.power?.powerSources.length || 0,
				frequency: lrcomm.components.isLongRangeComm.antennaFrequency,
				gain: lrcomm.components.isLongRangeComm.antennaGain,
				minSatelliteRange: lrcomm.components.isLongRangeComm.minSatelliteRange,
				maxSatelliteRange: lrcomm.components.isLongRangeComm.maxSatelliteRange,
			};
		}),
	commSatellites: t.procedure
		.autoPublish(["isCommSatellite"], (entity) => null)
		.request(({ ctx }) => {
			const satellites = ctx.ecs.componentCache.get("isCommSatellite") || [];
			const output: {
				id: number;
				frequency: number;
				radius: number;
				position: [number, number, number];
			}[] = [];

			for (const satellite of satellites) {
				const commSatellite = satellite.components.isCommSatellite;
				if (!commSatellite) continue;
				const commSatelliteSystem = getObjectSystem(satellite);
				if (!commSatelliteSystem?.components.position) continue;
				const { x, y, z } = commSatelliteSystem.components.position;
				output.push({
					id: satellite.id,
					frequency: commSatellite.frequency,
					radius: commSatellite.radius,
					position: [
						lightMinuteToLightYear(x),
						lightMinuteToLightYear(y),
						lightMinuteToLightYear(z),
					],
				});
			}

			return output;
		}),
	setFrequency: t.procedure
		.input(z.object({ shipId: z.number(), frequency: z.number() }))
		.send(({ ctx, input }) => {
			const lrcomm = getShipSystem(ctx.ecs, {
				systemType: "longRangeComm",
				shipId: input.shipId,
			});
			if (!lrcomm?.components.isLongRangeComm)
				throw new Error("No Long Range Comm System");
			lrcomm.updateComponent("isLongRangeComm", {
				antennaFrequency: input.frequency,
			});
			pubsub.publish.longRangeComm.get({ shipId: input.shipId });
		}),
	setGain: t.procedure
		.input(z.object({ shipId: z.number(), gain: z.number() }))
		.send(({ ctx, input }) => {
			const lrcomm = getShipSystem(ctx.ecs, {
				systemType: "longRangeComm",
				shipId: input.shipId,
			});
			if (!lrcomm?.components.isLongRangeComm)
				throw new Error("No Long Range Comm System");
			lrcomm.updateComponent("isLongRangeComm", { antennaGain: input.gain });
			pubsub.publish.longRangeComm.get({ shipId: input.shipId });
		}),

	systemStream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ input, entity }) => {
			if (!entity) return false;
			return Boolean(
				entity.components.isShipSystem?.shipId === input.shipId &&
					entity.components.power &&
					entity.components.isLongRangeComm,
			);
		}),
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
				const entity = ctx.ecs.getEntityById(m.contactId);
				return {
					id: m.contactId,
					name: m.name,
					entityName: entity?.components.identity?.name || "Unknown",
					actions: m.actions,
				};
			});
		}),
	outgoingMessages: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				filter: z.enum(["pending", "sent", "all"]),
			}),
		)
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
				| "message"
				| "senderStation"
				| "state"
				| "destinationId"
				| "failureReason"
				| "timestamp"
			> & {
				id: number;
				destinationShipName: string;
				encodedMessage: string;
				encodingType: z.infer<typeof isLongRangeMessage>["encoding"]["type"];
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
					input.filter === "sent" &&
					message.components.isLongRangeMessage.state === "pending"
				)
					continue;
				if (
					input.filter === "pending" &&
					message.components.isLongRangeMessage.state !== "pending"
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
					encodedMessage: encodeMessage(
						message.components.isLongRangeMessage.message,
						message.components.isLongRangeMessage.encoding,
					),
					encodingType: message.components.isLongRangeMessage.encoding.type,
					destinationId: message.components.isLongRangeMessage.destinationId,
					senderStation: message.components.isLongRangeMessage.senderStation,
					state: message.components.isLongRangeMessage.state,
					failureReason: message.components.isLongRangeMessage.failureReason,
					timestamp: message.components.isLongRangeMessage.timestamp,
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
			pubsub.publish.longRangeComm.addressBook({ shipId: input.shipId });
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
			pubsub.publish.longRangeComm.addressBook({ shipId: input.shipId });
		}),
	composeMessage: t.procedure
		.input(
			z.object({
				senderId: z.number(),
				destinationId: z.number(),
				message: z.string(),
				state: z.enum(["pending", "sending"]).optional(),
				senderStation: z.string().optional(),
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
			});
			ctx.ecs.addEntity(message);
			pubsub.publish.longRangeComm.outgoingMessages({ shipId: input.senderId });
		}),
	setMessageEncoding: t.procedure
		.input(
			z.object({
				messageId: z.number(),
				encoding: z.enum(["decoded", "waves", "replacement", "rotation"]),
			}),
		)
		.send(({ ctx, input }) => {
			const message = ctx.ecs.getEntityById(input.messageId);
			if (!message?.components.isLongRangeMessage)
				throw new Error("Invalid Long Range Message");

			let encoding: z.infer<typeof encodingSchema> = { type: "decoded" };
			switch (input.encoding) {
				case "waves":
					encoding = { type: "waves", hasPhase: false, waveCount: 1 };
					break;
				case "rotation":
					encoding = {
						type: "rotation",
						rotation: ctx.ecs.rng.nextAsPercentage() * 36,
					};
					break;
				case "replacement":
					encoding = { type: "replacement", includedLetters: 10 };
					break;
				case "decoded":
					break;
			}

			message.updateComponent("isLongRangeMessage", {
				encoding: generateEncoding(encoding, ctx.ecs.rng),
			});

			const shipId = message.components.isLongRangeMessage.senderId;

			pubsub.publish.longRangeComm.outgoingMessages({ shipId });

			return {
				encodedMessage: encodeMessage(
					message.components.isLongRangeMessage.message,
					message.components.isLongRangeMessage.encoding,
				),
			};
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
			} catch (e) {
				console.error(e);
				message.removeComponent("position");
				message.updateComponent("isLongRangeMessage", {
					state: "undelivered",
					failureReason: "Failed to find route through communications network",
				});
			} finally {
				pubsub.publish.longRangeComm.outgoingMessages({ shipId });
			}
		}),
});

const rotateCharacters =
	"abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const replaceCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";
function generateEncoding(
	encoding: z.infer<typeof encodingSchema>,
	rng: RNG,
): z.infer<typeof isLongRangeMessage>["encoding"] {
	switch (encoding.type) {
		case "replacement": {
			let requiredLetterMap = "";
			const requiredLetters = replaceCharacters.split("");
			while (requiredLetters.length > 0) {
				const letterIndex = Math.trunc(
					rng.nextAsPercentage() * requiredLetters.length,
				);
				const letter = requiredLetters.splice(letterIndex, 1);
				requiredLetterMap = `${requiredLetterMap}${letter.join("")}`;
			}
			let letterMap = replaceCharacters;
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
		case "rotation":
			return {
				type: "rotation",
				rotation: 0,
				requiredRotation: encoding.rotation,
			};
		case "decoded":
			return { type: "decoded" };
		default:
			encoding satisfies never;
			return { type: "decoded" };
	}
}

function encodeMessage(
	message: string,
	encoding: z.infer<typeof isLongRangeMessage>["encoding"],
) {
	switch (encoding.type) {
		case "rotation": {
			const encodedMessage = rotateMessage(
				message,
				rotateCharacters.length - encoding.requiredRotation,
			);
			const decodedMessage = rotateMessage(encodedMessage, encoding.rotation);
			return decodedMessage;
		}
		case "replacement": {
			const encodedMessage = replaceMessage(
				message,
				replaceCharacters,
				encoding.requiredLetterMap,
			);
			return replaceMessage(
				encodedMessage,
				encoding.requiredLetterMap,
				encoding.letterMap,
			);
		}
		case "waves": {
			function getWavePoint(
				i: number,
				waves: { frequency: number; phase: number; amplitude: number }[],
			) {
				let point = 0;
				for (const { frequency, phase, amplitude } of waves) {
					point += Math.sin(i / 2 / frequency + phase) * amplitude;
				}
				return point;
			}

			console.log(encoding);

			const output = message
				.split("")
				.map((letter, i) => {
					const letterIndex = rotateCharacters.indexOf(letter);
					if (letterIndex === -1) return letter;
					const diff =
						getWavePoint(
							i,
							encoding.waves.map((w) => ({
								frequency: w.requiredFrequency,
								amplitude: w.requiredAmplitude,
								phase: w.requiredPhase,
							})),
						) - getWavePoint(i, encoding.waves);
					const newLetterIndex =
						Math.round(letterIndex + diff * rotateCharacters.length) %
						rotateCharacters.length;
					const newLetter = rotateCharacters.split("").at(newLetterIndex);
					return newLetter;
				})
				.join("");

			console.log(output);
			return output;
		}
		case "decoded":
			return message;
	}
}
function rotateMessage(message: string, rotation: number) {
	let output = "";
	const rotatedCharacters =
		rotateCharacters.slice(rotation) + rotateCharacters.slice(0, rotation);

	for (const letter of message.split("")) {
		const index = rotateCharacters.indexOf(letter);
		if (index === -1) {
			output = output + letter;
			continue;
		}
		output = output + rotatedCharacters[index];
	}
	return output;
}
function replaceMessage(
	message: string,
	originalLetterMap: string,
	letterMap: string,
) {
	const splitMessage = message.split("");
	return splitMessage
		.map((letter) => {
			const mapIndex = originalLetterMap.indexOf(letter.toLowerCase());
			if (mapIndex === -1) return letter;
			return letterMap[mapIndex].toUpperCase();
		})
		.join("");
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

	if (startId === closestEndNode.id) {
		return startId;
	}

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
