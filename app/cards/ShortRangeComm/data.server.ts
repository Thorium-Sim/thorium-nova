import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { spawnShipSystem } from "@thorium/.server/spawners/shipSystem";
import { loadInkStory } from "@thorium/utils/.server/ink/loadInkStory";
import {
	bindInkFunctions,
	doForEachConversationPartner,
	runInkStory,
} from "@thorium/utils/.server/ink/runInkStory";
import {
	cancelLoopingSound,
	playShipSound,
} from "@thorium/utils/.server/playRangedSound";
import { scheduleAction } from "@thorium/utils/.server/scheduleAction";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { triggerAction } from "@thorium/utils/.server/triggerAction";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import {
	getCompletePositionFromOrbit,
	getObjectSystem,
} from "@thorium/utils/starmap/position";
import type { Story } from "inkjs";
import z from "zod";

export const shortRangeComm = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["isShortRangeComm"],
			(entity) =>
				entity.components.isShortRangeComm && [
					{ shipId: entity.components.isShipSystem?.shipId || -1 },
				],
		)
		.request(({ input, ctx }) => {
			try {
				const srcomm = getShipSystem(ctx.ecs, {
					systemType: "shortRangeComm",
					shipId: input.shipId,
				});
				if (!srcomm?.components.isShortRangeComm)
					throw new Error("No Short Range Comm");
				return {
					id: srcomm.id,
					requiredPower: srcomm.components.power?.powerLevels[0] || 0,
					maxSafePower: srcomm.components.power?.powerLevels.at(-1) || 1,
					currentPower: srcomm.components.power?.powerSources.length || 0,
					frequency: srcomm.components.isShortRangeComm.antennaFrequency,
					gain: srcomm.components.isShortRangeComm.antennaGain,
					actualGain: srcomm.components.isShortRangeComm.actualGain,
					minRadius: srcomm.components.isShortRangeComm.minRadius,
					maxRadius: srcomm.components.isShortRangeComm.maxRadius,
					state: srcomm.components.isShortRangeComm.state,
					conversationId: srcomm.components.isShortRangeComm.conversationId,
					templateConversationId:
						srcomm.components.isShortRangeComm.templateConversationId,
				};
			} catch {
				return null;
			}
		}),
	hailableEntities: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.filter((publish: { systemId: number | null }, { input }) => {
			if (!publish) return true;
			if (!publish.systemId && !input.systemId) return true;
			if (publish.systemId === input.systemId) return true;
			return false;
		})
		.autoPublish(["position", "satellite"], (entity) => {
			if (entity.components.position)
				return {
					systemId: entity.components.position.parentId,
				};
			if (entity.components.satellite) {
				const parent = getObjectSystem(entity);
				return {
					systemId: parent?.id || null,
				};
			}
		})
		.request(({ input, ctx }) => {
			const shortRangeSystems = ctx.ecs.componentCache.get("isShortRangeComm");
			const data: {
				shipId: number;
				shortRangeCommId: number;
				frequency: number;
			}[] = [];
			for (const entity of shortRangeSystems || []) {
				const hostEntity = ctx.ecs.getEntityById(
					entity.components.isShipSystem?.shipId || -1,
				);
				if (
					!hostEntity ||
					(hostEntity.components.position?.parentId !== input.systemId &&
						getObjectSystem(hostEntity)?.id !== input.systemId)
				)
					continue;
				data.push({
					shipId: hostEntity.id,
					frequency:
						entity.components.isShortRangeComm?.antennaFrequency || 100,
					shortRangeCommId: entity.id,
				});
			}
			return data;
		}),
	stream: t.procedure
		.input(z.object({ systemId: z.number().nullable() }))
		.dataStream(({ ctx, entity, input }) => {
			if (!entity) return false;
			// Get the ships and planets in this solar system to know the distance to what we're communicating with
			if (
				entity.components.position?.parentId === input.systemId ||
				getObjectSystem(entity)?.id === input.systemId
			)
				return true;
			return false;
		}),
	conversation: t.procedure
		.input(z.object({ conversationId: z.number().nullish() }))
		.filter((publish: { conversationId: number }, { ctx, input }) => {
			if (publish && publish.conversationId !== input.conversationId)
				return false;
			return true;
		})
		.autoPublish(["isShortRangeCommConversation"], (entity) => [
			{ conversationId: entity.id },
		])
		.request(({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId || -1);
			const srConvo = conversation?.components.isShortRangeCommConversation;
			if (!srConvo) return null;
			const participants: { id: number; name: string }[] = [];
			let hasTarget = false;
			doForEachConversationPartner(conversation, (srComm, shipId) => {
				if (srComm.components.isShortRangeComm?.state !== "connected") return;
				const ship = ctx.ecs.getEntityById(shipId);
				participants.push({
					id: shipId,
					name: ship?.components.identity?.name || "Unknown",
				});
				if (shipId === srConvo.targetId) hasTarget = true;
			});

			if (!hasTarget) {
				const targetName =
					ctx.ecs.getEntityById(srConvo.targetId)?.components.identity?.name ||
					"No Target";
				participants.push({ id: srConvo.targetId, name: targetName });
			}

			return {
				id: conversation.id,
				frequency: srConvo.frequency,
				hostId: srConvo.hostId,
				targetId: srConvo.targetId,
				participants,
			};
		}),
	incomingHailConversations: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(["isShortRangeCommConversation"], (entity) => [
			{ shipId: entity.components.isShortRangeCommConversation?.hostId || -1 },
			{
				shipId: entity.components.isShortRangeCommConversation?.targetId || -1,
			},
		])
		.request(({ ctx, input }) => {
			const conversations: {
				id: number;
				hostId: number;
				hostName: string;
				frequency: number;
			}[] = [];
			for (const conversation of ctx.ecs.componentCache.get(
				"isShortRangeCommConversation",
			) || []) {
				const convo = conversation.components.isShortRangeCommConversation;

				const hostId = convo?.hostId;
				if (!convo || !hostId || convo.targetId !== input.shipId) continue;
				const hostShortRange = getShipSystem(ctx.ecs, {
					systemType: "shortRangeComm",
					shipId: hostId,
				});
				const hostName =
					ctx.ecs.getEntityById(convo.hostId)?.components.identity?.name ||
					"Host";
				if (hostShortRange.components.isShortRangeComm?.state === "hailing") {
					conversations.push({
						id: conversation.id,
						frequency: convo.frequency,
						hostId: convo.hostId,
						hostName,
					});
				}
			}

			return conversations;
		}),
	setFrequency: t.procedure
		.input(z.object({ shipId: z.number(), frequency: z.number() }))
		.send(({ ctx, input }) => {
			const srcomm = getShipSystem(ctx.ecs, {
				systemType: "shortRangeComm",
				shipId: input.shipId,
			});
			if (!srcomm?.components.isShortRangeComm)
				throw new Error("No Short Range Comm System");
			srcomm.updateComponent("isShortRangeComm", {
				antennaFrequency: input.frequency,
			});
			const ship = ctx.ecs.getEntityById(input.shipId);
			const systemId =
				ship?.components.position?.parentId ||
				ship?.components.satellite?.parentId ||
				-1;
			pubsub.publish.shortRangeComm.get({ shipId: input.shipId });
			pubsub.publish.shortRangeComm.hailableEntities({ systemId });
		}),
	setGain: t.procedure
		.input(z.object({ shipId: z.number(), gain: z.number() }))
		.send(({ ctx, input }) => {
			const srcomm = getShipSystem(ctx.ecs, {
				systemType: "shortRangeComm",
				shipId: input.shipId,
			});
			if (!srcomm?.components.isShortRangeComm)
				throw new Error("No Short Range Comm System");

			srcomm.updateComponent("isShortRangeComm", {
				antennaGain: Math.max(0, Math.min(1, input.gain)),
			});
			pubsub.publish.shortRangeComm.get({ shipId: input.shipId });
		}),
	/**
	 * Defines the conversation that will happen when an NPC is hailed.
	 * If no conversation is set, the NPC will reject the hail.
	 */
	setTemplateConversation: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				templateConversationId: z.number().nullable(),
			}),
		)
		.send(({ ctx, input }) => {
			let srcomm: Entity;
			try {
				srcomm = getShipSystem(ctx.ecs, {
					systemType: "shortRangeComm",
					shipId: input.shipId,
				});
			} catch {
				srcomm = spawnShortRangeComm(input.shipId, ctx.ecs, ctx.flight!.mode);
			}
			srcomm.updateComponent("isShortRangeComm", {
				templateConversationId: input.templateConversationId,
			});
			pubsub.publish.shortRangeComm.get({ shipId: input.shipId });
		}),
	/**
	 * Creating a new conversation between two ships
	 */
	hail: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				targetId: z.number().optional(),
				conversationTemplateId: z.number().nullable().optional(),
				allowOtherParticipants: z.boolean().optional(),
			}),
		)
		.output(z.object({ conversationId: z.number() }))
		.send(({ ctx, input }) => {
			let srcomm: Entity;
			try {
				srcomm = getShipSystem(ctx.ecs, {
					systemType: "shortRangeComm",
					shipId: input.shipId,
				});
				if (!srcomm?.components.isShortRangeComm) {
					throw new Error("No Short Range Comm");
				}
			} catch {
				srcomm = spawnShortRangeComm(input.shipId, ctx.ecs, ctx.flight!.mode);
			}

			let targetSrComm: Entity | undefined;
			let targetId = input.targetId;
			if (input.targetId) {
				try {
					targetSrComm = getShipSystem(ctx.ecs, {
						systemType: "shortRangeComm",
						shipId: input.targetId,
					});
				} catch {
					targetSrComm = spawnShortRangeComm(
						input.targetId,
						ctx.ecs,
						ctx.flight!.mode,
					);
				}
			} else {
				const hailingShip = ctx.ecs.getEntityById(input.shipId);
				if (!hailingShip) throw new Error("No hailing ship.");
				const shipPosition = getCompletePositionFromOrbit(hailingShip);
				const { minRadius, maxRadius, actualGain } =
					srcomm.components.isShortRangeComm!;
				// Square once now to make it more efficient to compare later
				const gainRadiusKm =
					(minRadius + actualGain * (maxRadius - minRadius)) ** 2;

				// Find a target based on the frequency and gain of the ship that is doing the hailing
				for (const potentialTargetSrComm of ctx.ecs.componentCache.get(
					"isShortRangeComm",
				) || []) {
					if (potentialTargetSrComm.id === srcomm.id) continue;
					if (
						potentialTargetSrComm.components.isShortRangeComm &&
						potentialTargetSrComm.components.isShortRangeComm
							?.antennaFrequency ===
							srcomm.components.isShortRangeComm?.antennaFrequency
					) {
						const targetShip = ctx.ecs.getEntityById(
							potentialTargetSrComm.components.isShipSystem?.shipId || -1,
						);
						if (!targetShip) continue;
						const targetPosition = getCompletePositionFromOrbit(targetShip);
						if (
							shipPosition.distanceToSquared(targetPosition) <= gainRadiusKm
						) {
							targetId = targetShip.id;
							targetSrComm = potentialTargetSrComm;
							break;
						}
					}
				}
			}

			const conversationTemplateId =
				input.conversationTemplateId ||
				targetSrComm?.components.isShortRangeComm?.templateConversationId;
			const conversationTemplate = ctx.ecs.getEntityById(
				conversationTemplateId || -1,
			);

			const conversation = new Entity();
			conversation.addComponent("isShortRangeCommConversation", {
				hostId: input.shipId,
				targetId,
				frequency: srcomm.components.isShortRangeComm?.antennaFrequency,
				conversationTemplateId: input.conversationTemplateId,
				allowAdditionalParticipants: input.allowOtherParticipants || false,
			});
			conversation.addComponent("isConversation", {
				inkFilePath:
					conversationTemplate?.components.isConversationTemplate?.inkFilePath,
			});
			ctx.ecs.addEntity(conversation);

			// Set the conversation here, but don't kick off the Ink script until its properly connected
			srcomm.updateComponent("isShortRangeComm", {
				state: "hailing",
				conversationId: conversation.id,
			});

			// When hailing an NPC, if that NPC is already in a conversation, reject it immediately.
			if (
				targetSrComm?.components.isShortRangeComm?.conversationId &&
				targetSrComm?.components.isShortRangeComm.state === "connected"
			) {
				// Swap the target and ship, since in this case, the target is the one doing the rejecting
				triggerAction("shortRangeComm.reject", {
					shipId: targetId,
					conversationId: conversation.id,
				});
				return { conversationId: -1 };
			}

			const hostShip = ctx.ecs.getEntityById(input.shipId || -1);
			const targetShip = ctx.ecs.getEntityById(targetId || -1);

			// If an NPC has no conversation template, the hail will be rejected after a few seconds
			// unless there is a Flight Director on the flight
			if (
				!conversationTemplate?.components.isConversationTemplate &&
				!ctx.flight?.hasFlightDirector
			) {
				// Swap the target and ship, since in this case, the target is the one doing the rejecting
				scheduleAction(
					ctx.ecs,
					"shortRangeComm.reject",
					{ shipId: targetId, conversationId: conversation.id },
					3000 + ctx.ecs.rng.nextInt(2000, 4000),
				);
			}

			// Automatically have the NPC connect the hail
			else if (
				!ctx.flight?.hasFlightDirector &&
				!targetShip?.components.isPlayerShip &&
				targetId
			) {
				scheduleAction(
					ctx.ecs,
					"shortRangeComm.connect",
					{ shipId: targetId, conversationId: conversation.id },
					3000 + ctx.ecs.rng.nextInt(2000, 4000),
				);
			}

			if (hostShip) {
				// Play hailing sounds for both ships
				cancelLoopingSound(srcomm, "outgoingHail");
				playShipSound(srcomm, hostShip, "outgoingHail");
			}
			if (targetSrComm && targetShip) {
				cancelLoopingSound(targetSrComm, "incomingHail");
				playShipSound(targetSrComm, targetShip, "incomingHail");
			}

			pubsub.publish.shortRangeComm.conversation({
				conversationId: conversation.id,
			});
			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
			pubsub.publish.shortRangeComm.get({ shipId: input.shipId });
			pubsub.publish.shortRangeComm.get({ shipId: targetId || -1 });
			pubsub.publish.shortRangeComm.incomingHailConversations({
				shipId: input.shipId,
			});
			pubsub.publish.shortRangeComm.incomingHailConversations({
				shipId: targetId || -1,
			});
			return { conversationId: conversation.id };
		}),
	reject: t.procedure
		.input(
			z.object({ shipId: z.number().optional(), conversationId: z.number() }),
		)
		.send(({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId);
			const srConvo = conversation?.components.isShortRangeCommConversation;
			const shipId = input.shipId || srConvo?.targetId || -1;
			const srcomm = getShipSystem(ctx.ecs, {
				systemType: "shortRangeComm",
				shipId,
			});

			if (!conversation || !srConvo || !srcomm.components.isShortRangeComm)
				throw new Error("Unable to reject");

			const hostShip = ctx.ecs.getEntityById(srConvo.hostId);
			// Cancel the hailing sound for both ships
			const hostShortRangeComm = getShipSystem(ctx.ecs, {
				systemType: "shortRangeComm",
				shipId: srConvo.hostId,
			});

			if (hostShortRangeComm) {
				cancelLoopingSound(hostShortRangeComm, "outgoingHail");
				if (hostShip) {
					playShipSound(hostShortRangeComm, hostShip, "rejected");
				}
			}

			const rejectingShip = ctx.ecs.getEntityById(shipId);
			cancelLoopingSound(srcomm, "incomingHail");
			if (rejectingShip) {
				playShipSound(srcomm, rejectingShip, "rejected");
			}

			hostShortRangeComm?.updateComponent("isShortRangeComm", {
				conversationId: null,
				state: "idle",
			});
			ctx.ecs.removeEntity(conversation);
			pubsub.publish.shortRangeComm.conversation({
				conversationId: conversation.id,
			});
			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
			pubsub.publish.shortRangeComm.get({ shipId });
			if (hostShip) {
				pubsub.publish.shortRangeComm.get({ shipId: hostShip.id });
				pubsub.publish.shortRangeComm.incomingHailConversations({
					shipId: hostShip.id,
				});
			}
			pubsub.publish.shortRangeComm.incomingHailConversations({
				shipId,
			});
		}),
	connect: t.procedure
		.input(z.object({ shipId: z.number(), conversationId: z.number() }))
		.send(async ({ ctx, input }) => {
			// Only connect if the conversation still exists
			const conversation = ctx.ecs.getEntityById(input.conversationId);
			const srConvo = conversation?.components.isShortRangeCommConversation;
			const convo = conversation?.components.isConversation;

			const shipId = input.shipId || srConvo?.targetId || -1;

			const srcomm = getShipSystem(ctx.ecs, {
				systemType: "shortRangeComm",
				shipId,
			});

			if (
				!convo ||
				!srConvo ||
				!conversation ||
				!srcomm.components.isShortRangeComm
			)
				throw new Error("Unable to connect");

			// If the connecting ship is neither the host nor the target, only allow the connection
			// if the conversation allows connections
			if (
				input.shipId !== srConvo.hostId &&
				input.shipId !== srConvo.targetId &&
				!srConvo.allowAdditionalParticipants
			) {
				throw new Error(
					"Unable to connect — communication only allows two participants.",
				);
			}

			// If the conversation has no Ink story, instantiate it
			let story = convo.inkStory as Story;
			if (!story && convo.inkFilePath) {
				const hostShip = ctx.ecs.getEntityById(srConvo.hostId);
				const targetShip = ctx.ecs.getEntityById(srConvo.targetId);
				const playerShip = hostShip?.components.isPlayerShip
					? hostShip
					: targetShip;
				const npcShip = hostShip?.components.isPlayerShip
					? targetShip
					: hostShip;
				story = await loadInkStory(convo.inkFilePath, convo.conversationState, {
					playerShipName: playerShip?.components.identity?.name || "Captain",
					playerShipId: playerShip?.id || -1,
					npcShipId: npcShip?.id || -1,
					conversationId: conversation.id,
				});
				bindInkFunctions(story, conversation);
				conversation.updateComponent("isConversation", {
					inkStory: story,
				});
			}

			srcomm.updateComponent("isShortRangeComm", {
				conversationId: conversation.id,
				state: "connected",
			});

			if (story) {
				// Run the story, executing any actions and events until we get to some actual dialogue.
				await runInkStory(conversation);
			}

			cancelLoopingSound(srcomm, "incomingHail");
			const targetShip = ctx.ecs.getEntityById(shipId);
			if (targetShip) {
				playShipSound(srcomm, targetShip, "connected");
			}
			// Update the host to be connected too, and play the connected sound effect
			doForEachConversationPartner(conversation, (entity, shipId) => {
				const ship = ctx.ecs.getEntityById(shipId);
				if (ship) {
					if (entity.components.isShortRangeComm?.state === "connected") {
						playShipSound(entity, ship, "incomingConnection");
					} else {
						playShipSound(entity, ship, "connected");
					}
				}
				cancelLoopingSound(entity, "outgoingHail");
				cancelLoopingSound(entity, "incomingHail");

				entity.updateComponent("isShortRangeComm", { state: "connected" });
				pubsub.publish.shortRangeComm.get({ shipId });
				pubsub.publish.shortRangeComm.incomingHailConversations({ shipId });
			});

			pubsub.publish.shortRangeComm.conversation({
				conversationId: conversation.id,
			});
			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
		}),
	disconnect: t.procedure
		.input(z.object({ shipId: z.number() }))
		.output(z.object({ shipId: z.number(), previousState: z.string() }))
		.meta({ action: true, event: true })
		.send(({ ctx, input }) => {
			const srcomm = getShipSystem(ctx.ecs, {
				systemType: "shortRangeComm",
				shipId: input.shipId,
			});
			if (!srcomm?.components.isShortRangeComm)
				throw new Error("No Short Range Comm System");

			const conversation = ctx.ecs.getEntityById(
				srcomm.components.isShortRangeComm.conversationId || -1,
			);

			// Play the disconnect sound for all ships connected to this conversation
			// to indicate that another ship disconnected
			if (srcomm.components.isShortRangeComm?.state === "hailing") {
				const targetShipId =
					conversation?.components.isShortRangeCommConversation?.targetId || -1;
				let targetSrComm: Entity | undefined;
				try {
					targetSrComm = getShipSystem(ctx.ecs, {
						systemType: "shortRangeComm",
						shipId: targetShipId,
					});
				} catch {}
				const ship = ctx.ecs.getEntityById(input.shipId);

				cancelLoopingSound(srcomm, "outgoingHail");
				if (ship) {
					playShipSound(srcomm, ship, "cancelled");
				}
				if (targetSrComm) {
					cancelLoopingSound(targetSrComm, "incomingHail");
					const targetShip = ctx.ecs.getEntityById(
						targetSrComm.components.isShipSystem?.shipId || -1,
					);
					if (targetShip) {
						playShipSound(targetSrComm, targetShip, "cancelled");
					}
				}
				pubsub.publish.shortRangeComm.incomingHailConversations({
					shipId: input.shipId,
				});
				pubsub.publish.shortRangeComm.incomingHailConversations({
					shipId: targetShipId,
				});
			} else if (srcomm.components.isShortRangeComm.state === "connected") {
				if (conversation) {
					doForEachConversationPartner(conversation, (entity, shipId) => {
						const ship = ctx.ecs.getEntityById(shipId);
						if (ship) {
							playShipSound(entity, ship, "disconnected");
						}
						pubsub.publish.effects.dialogue({
							type: "stopDialogue",
							conversationId: conversation.id,
							shipId,
						});
					});
				}
			}

			// When only one participant remains, the conversation remains active so the participant that
			// left can rejoin the conversation later on. This means that if an NPC disconnects, the player ship
			// will also have to disconnect. This does provide them with the ability to see the history of the conversation
			// after the conversation has ended.
			const previousState = srcomm.components.isShortRangeComm.state;
			srcomm.updateComponent("isShortRangeComm", {
				conversationId: null,
				state: "idle",
			});
			pubsub.publish.shortRangeComm.get({ shipId: input.shipId });

			return { shipId: input.shipId, previousState };
		}),
	disconnectConversation: t.procedure
		.input(z.object({ conversationId: z.number() }))
		.send(({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId);

			if (!conversation) throw new Error("Conversation not found.");
			doForEachConversationPartner(conversation, (entity, shipId) => {
				const ship = ctx.ecs.getEntityById(shipId);
				if (ship) {
					playShipSound(entity, ship, "disconnected");
				}
				entity.updateComponent("isShortRangeComm", {
					conversationId: null,
					state: "idle",
				});
				pubsub.publish.shortRangeComm.get({ shipId });
				pubsub.publish.effects.dialogue({
					type: "stopDialogue",
					conversationId: conversation.id,
					shipId,
				});
			});
		}),
});

function spawnShortRangeComm(
	shipId: number,
	ecs: ECS,
	flightMode: "nova" | "legacy",
) {
	const shipEntity = ecs.getEntityById(shipId);
	if (!shipEntity) throw new Error("Ship not found");
	// If we're intentionally setting a template conversation on an object,
	// that means that entity should have a short range comm system. Let's
	// add one.
	const [entity] = spawnShipSystem(
		shipId,
		{ name: "Short Range Comm", tags: ["generated"], type: "shortRangeComm" },
		flightMode,
		false,
		{},
	);

	// We'll remove power, heat, and damage for simplicity
	entity.removeComponent("power");
	entity.removeComponent("heat");
	entity.removeComponent("damage");
	ecs.addEntity(entity);
	if (!shipEntity.components.shipSystems) {
		shipEntity.addComponent("shipSystems");
	}
	shipEntity.components.shipSystems?.shipSystems.set(entity.id, {});
	return entity;
}
