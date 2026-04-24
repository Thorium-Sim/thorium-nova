import { parseConversationLine } from "./parseConversationLine";
import { triggerAction } from "../triggerAction";
import { spawnTrigger } from "@thorium/.server/spawners/trigger";
import type { ECS, Entity } from "@thorium/utils/ecs";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import uniqid from "@thorium/utils/uniqid";
import { pubsub } from "@thorium/.server/init/pubsub";
import { measureAudioDurationMs } from "./measureAudioDuration";
import { scheduleAction } from "../scheduleAction";
import type { Story } from "inkjs";
import { getValueReference } from "../executeBlocks";
import { interpolateText } from "@thorium/utils/interpolationEngine";
import { loadInkStory } from "@thorium/utils/.server/ink/loadInkStory";
import path from "node:path";

export async function runInkStory(conversation: Entity) {
	const convo = conversation.components.isConversation;
	const story = await lazyLoadInkStory(conversation);
	if (!convo || !story) return;

	// Clear out any non-persisted triggers for this conversation
	for (const trigger of conversation.ecs.componentCache.get("isTrigger") ||
		[]) {
		if (
			!trigger.components.isTrigger?.persist &&
			trigger.components.isTrigger?.stepId === conversation.id
		) {
			conversation.ecs.removeEntityById(trigger.id);
		}
	}

	while (story.canContinue) {
		const line = story.Continue();
		if (!line) continue;
		const lineAction = parseConversationLine(line, story.currentTags || []);
		switch (lineAction.type) {
			case "action":
				{
					const localVariables = {};
					const values = Object.fromEntries(
						Object.entries(lineAction.params).map(([key, value]) => {
							let val = getValueReference(
								value,
								localVariables,
								conversation.ecs,
							);
							// Special handling for certain keys we know are entity id references
							if (key === "shipId" || key === "entityId") {
								val = Number(val);
							} else if (typeof val === "string") {
								// Other values get interpolated automatically
								val = interpolateText(
									val,
									localVariables,
									conversation.ecs.rng,
								);
							}

							return [key, val];
						}),
					);
					await triggerAction(lineAction.action, values);
				}
				break;
			case "event": {
				const actionBlock = {
					type: "Action" as const,
					id: uniqid("ink-"),
					action: "conversation.divert",
					values: {
						conversationId: conversation.id,
						divert: lineAction.divert,
					},
				};
				const blocks: TimelineBlock[] = [];
				if (Object.keys(lineAction.params).length > 0) {
					// Put all of the params into blocks
					for (const key in lineAction.params) {
						blocks.push({
							type: "ResultPropertyIntoVariable",
							id: uniqid("ink"),
							property: key,
							variable: key,
						});
					}
					// Then add the if condition
					blocks.push({
						type: "IfCondition",
						id: uniqid("ink-"),
						triggerBlocks: [actionBlock],
						conditions: Object.entries(lineAction.params).map(
							([key, value]) => ({
								comparison: "=",
								value1: `$${key}`,
								value2: value,
							}),
						),
					});
				} else {
					blocks.push(actionBlock);
				}
				const triggerEntity = spawnTrigger({
					trigger: {
						active: true,
						conditions: [{ type: "eventListener", event: lineAction.event }],
						multiple: false,
						persist: lineAction.persist,
						triggeredAt: null,
						blocks,
						localVariables: {},
						// We'll use this to indicate the conversation
						stepId: conversation.id,
					},
				});
				conversation.ecs.addEntity(triggerEntity);

				break;
			}
			case "dialogue": {
				// Find the entity that spoke the line, default to the non-player participant
				const speakerId = findSpeakerId(
					conversation.ecs,
					lineAction.speakerName,
				);
				conversation.updateComponent("isConversation", {
					currentDialogue: [
						...convo.currentDialogue,
						{ speakerId, text: lineAction.dialogue },
					],
				});
				// TODO April 6, 2026 — find some way to look up any dialogue files that might be coming in the future and
				// instruct the browser to download those files so they're ready.
				for (const tag of story.currentTags || []) {
					if (
						tag.toLowerCase().endsWith(".wav") ||
						tag.toLowerCase().endsWith(".mp3") ||
						tag.toLowerCase().endsWith(".ogg")
					) {
						let hasDialoguePlayer = false;

						let audioFilepath = tag.trim();
						if (
							!audioFilepath.startsWith("/") &&
							conversation.components.isConversation?.inkFilePath
						) {
							// Relative path based on the conversation's ink file
							audioFilepath = path.join(
								path.dirname(
									conversation.components.isConversation.inkFilePath,
								),
								tag.trim(),
							);
						}
						// Play any audio dialogue associated with this conversation line
						doForEachConversationPartner(conversation, (entity, shipId) => {
							// It doesn't matter if this is sent to NPC ships — they shouldn't
							// have clients assigned to them anyway
							pubsub.publish.effects.dialogue({
								type: "dialogue",
								conversationId: conversation.id,
								shipId,
								audioFilepath,
							});
							hasDialoguePlayer = true;
						});
						if (hasDialoguePlayer) {
							// We stop evaluating the story here until the line of
							// audio dialogue is delivered
							const duration = await measureAudioDurationMs(tag);
							scheduleAction(
								conversation.ecs,
								"conversation.continue",
								{ conversationId: conversation.id },
								duration,
							);
							// Cease running the story until the dialogue is complete
							return;
						}
					}
					break;
				}
			}
		}
	}
	// Put the choices into the conversation entity
	const choices = story.currentChoices.map((c) => {
		const colonSplit = c.text.split(":");
		const speakerId = findSpeakerId(conversation.ecs, colonSplit[0]);
		return { text: c.text, speakerId, selected: false };
	});

	conversation.updateComponent("isConversation", { currentChoices: choices });
}

function findSpeakerId(ecs: ECS, speakerName: string) {
	let speakerId: number = -1;
	for (const entity of ecs.componentCache.get("identity") || []) {
		if (
			entity.components.identity?.name.toLowerCase() ===
			speakerName.toLowerCase()
		) {
			speakerId = entity.id;
			break;
		}
	}
	return speakerId;
}

// TODO April 6 2026 — Add additional conversation types here, if they are ever developed,
// such as ship internal conversations
export function doForEachConversationPartner(
	conversation: Entity,
	callback: (shortRangeCommEntity: Entity, shipId: number) => void,
) {
	for (const entity of conversation.ecs.componentCache.get(
		"isShortRangeComm",
	) || []) {
		if (
			entity.components.isShortRangeComm?.conversationId === conversation.id &&
			entity.components.isShipSystem?.shipId
		) {
			callback(entity, entity.components.isShipSystem.shipId);
		}
	}
}

export async function lazyLoadInkStory(conversation: Entity) {
	if (!conversation?.components.isConversation?.inkFilePath)
		throw new Error("Conversation not found");

	if (!conversation.components.isConversation.inkStory) {
		conversation.updateComponent("isConversation", {
			inkStory: await loadInkStory(
				conversation.components.isConversation.inkFilePath,
				conversation.components.isConversation.conversationState,
			),
		});
	}

	return conversation.components.isConversation.inkStory as Story;
}
