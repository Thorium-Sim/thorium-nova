import { Objective } from "@thorium/cards/Objectives";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";

export function ObjectivesGizmo({ className }: { className?: string }) {
	const { shipId } = useStation();

	const [objectives] = q.objectives.get.useNetRequest({ shipId });
	const sortedObjectives = objectives
		.filter((o) => o.state === "active")
		.sort((a, b) => {
			if (a.priority > b.priority) return -1;
			if (a.priority < b.priority) return 1;
			return 0;
		})
		.reverse();

	return (
		<div className={cn(className, "@container max-w-72 w-full text-base")}>
			{sortedObjectives.map((objective) => (
				<Objective key={objective.id} {...objective} size="sm" />
			))}
		</div>
	);
}
