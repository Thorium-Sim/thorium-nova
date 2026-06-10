import { Navigate } from "@thorium/components/Navigate";
import { TimelineStepEditor } from "@thorium/components/StepEditor";
import { q } from "@thorium/context/AppContext";
import { href } from "react-router";

import type { Route } from "./+types/step";

export default function TrainingStep({
	params: { pluginId, timelineId, stepId },
}: Route.ComponentProps) {
	const [timeline] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "trainings",
	});

	const step = timeline.steps.find((s) => s.id === stepId);

	if (!step)
		return (
			<Navigate to={href("/config/:pluginId/trainings/:timelineId", { pluginId, timelineId })} />
		);

	return (
		<TimelineStepEditor
			pluginId={pluginId}
			timelineId={timelineId}
			timelineType="trainings"
			step={step}
		/>
	);
}
