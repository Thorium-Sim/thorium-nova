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
import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { convertArray } from "three/src/animation/AnimationUtils.js";

export async function runInkStory(conversation: Entity) {
	const convo = conversation.components.isConversation;
	const story = await lazyLoadInkStory(conversation);
	if (!convo || !story) return;

	const pathStrings = [];
	while (story.canContinue) {
		const line = story.Continue();
		if (!line) continue;

		const pathString =
			story.state.currentPathString
				?.split(".")
				.filter((f) => Number(f).toString() !== f)
				.join(".") || "";
		pathStrings.push(pathString);

		const lineAction = parseConversationLine(line, story.currentTags || []);
		switch (lineAction.type) {
			case "action":
				{
					// TODO April 25, 2026: Don't re-run actions when replaying parts of the conversation
					const localVariables = {};
					const values = Object.fromEntries(
						Object.entries(lineAction.params).map(([key, value]) => {
							let val = getValueReference(
								value,
								localVariables,
								conversation.ecs,
							);
							// Special handling for numbers
							if (Number(val).toString() === val && key !== "alertLevel") {
								val = Number(val);
							} else if (val === "null") {
								val = null;
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
					conversation.updateComponent("isConversation", {
						executedActions: [
							...(conversation.components.isConversation?.executedActions ||
								[]),
							pathString,
						],
					});
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
				const localVariables = {};

				const values = Object.fromEntries(
					Object.entries(lineAction.params).map(([key, value]) => {
						let val = value;
						// Special handling for numbers
						if (Number(val).toString() === val) {
							val = Number(val);
						} else if (val === "null") {
							val = null;
						} else if (typeof val === "string") {
							// Other values get interpolated automatically
							val = interpolateText(val, localVariables, conversation.ecs.rng);
						}
						return [key, val];
					}),
				);

				const triggerEntity = spawnTrigger({
					trigger: {
						active: true,
						conditions: [
							{
								type: "eventListener",
								event: lineAction.event,
								values,
							},
						],
						multiple: false,
						persist: lineAction.persist,
						triggeredAt: null,
						blocks: [actionBlock],
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
						{ id: uniqid("dlg-"), speakerId, text: lineAction.dialogue },
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
							const duration = await measureAudioDurationMs(
								path.join(thoriumPath, audioFilepath),
							);
							scheduleAction(
								conversation.ecs,
								"conversation.continue",
								{ conversationId: conversation.id },
								duration,
							);
							// Cease running the story until the dialogue is complete
							conversation.updateComponent("isConversation", {
								executedPaths: [...convo.executedPaths, ...pathStrings],
							});
							return;
						}
					}
					break;
				}
			}
		}
	}
	conversation.updateComponent("isConversation", {
		executedPaths: [...convo.executedPaths, ...pathStrings],
	});
	// Put the choices into the conversation entity
	const choices = story.currentChoices.map((c) => {
		const colonSplit = c.text.split(":");
		const speakerId = findSpeakerId(conversation.ecs, colonSplit[0]);
		return { id: uniqid("chs-"), text: c.text, speakerId, selected: false };
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
		const inkStory = await loadInkStory(
			conversation.components.isConversation.inkFilePath,
			conversation.components.isConversation.conversationState,
		);
		bindInkFunctions(inkStory, conversation);
		conversation.updateComponent("isConversation", {
			inkStory,
		});
	}

	return conversation.components.isConversation.inkStory as Story;
}

export function bindInkFunctions(story: Story, conversation: Entity) {
	story.BindExternalFunction("getLastPath", () => {
		console.log(conversation.components.isConversation?.executedPaths.at(-2));
		return (
			story.KnotContainerWithName(
				conversation.components.isConversation?.executedPaths.at(-2) || "",
			)?.path || story.variablesState.lastPath
		);
	});
}
