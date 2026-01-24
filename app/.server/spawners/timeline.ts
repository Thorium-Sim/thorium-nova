import type MissionPlugin from "@thorium/.server/classes/Plugins/Mission";
import type ReportPlugin from "@thorium/.server/classes/Plugins/Report";
import type TrainingPlugin from "@thorium/.server/classes/Plugins/Training";
import { Entity } from "@thorium/utils/ecs";

export function spawnTimeline(
	timeline: MissionPlugin | ReportPlugin | TrainingPlugin,
	addEntity: (entity: Entity) => void,
	shipId?: number,
) {
	// Create the timeline entity
	const timelineEntity = new Entity();
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

	// August 25, 2023 - Send the necessary pubsub updates
	return timelineEntity;
}
