import z from "zod";
import { t } from "../init/t";
import { runInkStory } from "@thorium/utils/.server/ink/runInkStory";
import type { Story } from "inkjs";
import { produce } from "immer";
import { pubsub } from "../init/pubsub";

export const conversation = t.router({
	conversation: t.procedure
		.input(z.object({ conversationId: z.number() }))
		.filter((publish: { conversationId: number }, { ctx, input }) => {
			if (publish && publish.conversationId !== input.conversationId)
				return false;
			return true;
		})
		.autoPublish(["isConversation"], (entity) => [
			{ conversationId: entity.id },
		])
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
	divert: t.procedure
		.input(z.object({ conversationId: z.number(), divert: z.string() }))
		.send(async ({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId);
			if (!conversation?.components.isConversation?.inkStory)
				throw new Error("Conversation not found");

			conversation.components.isConversation.inkStory.ChoosePathString(
				input.divert,
			);
			await runInkStory(conversation);

			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
		}),
	continue: t.procedure
		.input(z.object({ conversationId: z.number() }))
		.send(async ({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId);
			if (!conversation?.components.isConversation?.inkStory)
				throw new Error("Conversation not found");
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
		.send(async ({ ctx, input }) => {
			const conversation = ctx.ecs.getEntityById(input.conversationId);
			const convo = conversation?.components.isConversation;
			const story = convo?.inkStory as Story;
			if (!story || !convo) throw new Error("Conversation not found");

			const choiceIndex = story.currentChoices.findIndex(
				(choice) => choice.text === input.choice,
			);

			if (choiceIndex === -1) throw new Error("Invalid choice");

			story.ChooseChoiceIndex(choiceIndex);
			conversation.updateComponent("isConversation", {
				currentChoices: produce(convo.currentChoices, (choices) => {
					choices[choiceIndex].selected = true;
				}),
			});

			await runInkStory(conversation);
			pubsub.publish.conversation.conversation({
				conversationId: conversation.id,
			});
		}),
});
