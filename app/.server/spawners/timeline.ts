import type MissionPlugin from "@thorium/.server/classes/Plugins/Mission";
import type ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import type TrainingPlugin from "@thorium/.server/classes/Plugins/Training";
import { Entity } from "@thorium/utils/ecs";

export function spawnTimeline(
	timeline: MissionPlugin | ReportPlugin | TrainingPlugin,
	addEntity: (entity: Entity) => void,
	shipId?: number,
	timelineEntity = new Entity(),
) {
	// Create the timeline entity
	const stepIds: number[] = [];
	for (const stepItem of timeline.steps) {
		const step = new Entity();
		step.addComponent("identity", {
			name: stepItem.name,
			description: stepItem.description,
		});
		step.addComponent("tags", { tags: stepItem.tags });
		step.addComponent("isTimelineStep", {
			blocks: JSON.parse(JSON.stringify(stepItem.blocks || [])),
			timelineId: timelineEntity.id,
		});
		addEntity(step);
		stepIds.push(step.id);
	}

	timelineEntity.addComponent("identity", {
		name: timeline.name,
		description: timeline.description,
	});
	timelineEntity.addComponent("tags", { tags: timeline.tags });
	timelineEntity.addComponent("isTimeline", {
		shipId,
		steps: stepIds,
		type:
			timeline.kind === "missions"
				? "mission"
				: timeline.kind === "reports"
					? "report"
					: timeline.kind === "trainings"
						? "training"
						: undefined,
	});
	addEntity(timelineEntity);

	// Spawn all of the conversation templates
	for (const conversation of timeline.plugin.aspects.conversations) {
		if (
			conversation.timelineId === timeline.name &&
			conversation.pluginName === timeline.pluginName
		) {
			const conversationEntity = new Entity();
			conversationEntity.addComponent("isConversationTemplate", {
				inkFilePath: conversation.assets.conversation,
			});
			conversationEntity.addComponent("identity", {
				name: conversation.name,
				description: conversation.description,
			});
			conversationEntity.addComponent("tags", { tags: conversation.tags });
			addEntity(conversationEntity);
		}
	}
	// August 25, 2023 - Send the necessary pubsub updates
	return timelineEntity;
}
