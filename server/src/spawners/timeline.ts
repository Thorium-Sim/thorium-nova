import type TimelinePlugin from "@server/classes/Plugins/Timeline";
import {Entity} from "@server/utils/ecs";

export function spawnTimeline(
  timeline: TimelinePlugin,
  addEntity: (entity: Entity) => void
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
    step.addComponent("tags", {tags: stepItem.tags});
    step.addComponent("isTimelineStep", {
      actions: stepItem.actions,
      active: false,
      timelineId: timelineEntity.id,
    });
    addEntity(step);
    stepIds.push(step.id);
  }

  timelineEntity.addComponent("identity", {
    name: timeline.name,
    description: timeline.description,
  });
  timelineEntity.addComponent("tags", {tags: timeline.tags});
  timelineEntity.addComponent("isTimeline", {
    steps: stepIds,
    isMission: timeline.isMission,
  });
  addEntity(timelineEntity);

  // August 25, 2023 - Send the necessary pubsub updates
  return stepIds;
}
