import { lazyLoadInkStory, runInkStory } from "@thorium/utils/.server/ink/runInkStory";
import uniqid from "@thorium/utils/uniqid";
import { produce } from "immer";
import z from "zod";

import { pubsub } from "../init/pubsub";
import { t } from "../init/t";

export const conversation = t.router({
	conversation: t.procedure
		.input(z.object({ conversationId: z.number() }))
		.filter((publish: { conversationId: number }, { input }) => {
			if (publish && publish.conversationId !== input.conversationId) return false;
			return true;
		})
		.autoPublish(["isConversation"], (entity) => [{ conversationId: entity.id }])
		.request(({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId);
			const convo = conversation?.components.isConversation;
			if (!convo) throw new Error("Conversation not found.");
			return {
				id: conversation.id,
				currentChoices: convo.currentChoices,
				currentDialogue: convo.currentDialogue,
			};
		}),
	conversationTemplates: t.procedure
		.autoPublish(["isConversationTemplate"], () => null)
		.request(({ ctx }) => {
			const templates = [];
			for (const template of ctx.ecs.componentCache.get("isConversationTemplate") || []) {
				if (!template.components.identity?.name || !template.components.isConversationTemplate)
					continue;
				templates.push({
					id: template.id,
					name: template.components.identity.name,
					inkFilePath: template.components.isConversationTemplate.inkFilePath,
				});
			}
			return templates;
		}),
	divert: t.procedure
		.input(z.object({ conversationId: z.number(), divert: z.string() }))
		.send(async ({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId)!;
			const inkStory = await lazyLoadInkStory(conversation);

			inkStory.ChoosePathString(input.divert);

			// Clear out any non-persisted triggers for this conversation
			for (const trigger of conversation.ecs.componentCache.get("isTrigger") || []) {
				if (
					!trigger.components.isTrigger?.persist &&
					trigger.components.isTrigger?.stepId === conversation.id
				) {
					conversation.ecs.removeEntityById(trigger.id);
				}
			}
			conversation.updateComponent("isConversation", { currentChoices: [] });

			await runInkStory(conversation);

			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
		}),
	continue: t.procedure
		.input(z.object({ conversationId: z.number() }))
		.send(async ({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId)!;

			await runInkStory(conversation);
			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
		}),
	selectChoice: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				conversationId: z.number(),
				choice: z.string(),
			}),
		)
		.meta({ event: true })
		.output(z.object({ shipId: z.number(), conversationId: z.number(), choice: z.string() }))
		.send(async ({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId)!;
			const inkStory = await lazyLoadInkStory(conversation);

			const choiceIndex = inkStory.currentChoices.findIndex(
				(choice) => choice.text === input.choice,
			);

			if (choiceIndex === -1) throw new Error("Invalid choice");

			inkStory.ChooseChoiceIndex(choiceIndex);
			conversation.updateComponent("isConversation", {
				currentDialogue: [
					...(conversation.components.isConversation?.currentDialogue || []),
					{
						id: uniqid("dlg-"),
						speakerId: input.shipId,
						text: input.choice.split(": ").slice(1).join(": "),
					},
				],
				currentChoices: produce(
					conversation.components.isConversation?.currentChoices || [],
					(choices) => {
						choices[choiceIndex].selected = true;
					},
				),
			});

			// Clear out any non-persisted triggers for this conversation
			for (const trigger of conversation.ecs.componentCache.get("isTrigger") || []) {
				if (
					!trigger.components.isTrigger?.persist &&
					trigger.components.isTrigger?.stepId === conversation.id
				) {
					conversation.ecs.removeEntityById(trigger.id);
				}
			}
			await runInkStory(conversation);
			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
			return input;
		}),
});
