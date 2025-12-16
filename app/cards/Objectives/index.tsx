import { Objective } from "@thorium/cards/Objectives/Objective";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";

export function Objectives() {
	const { shipId } = useStation();

	const [objectives] = q.objectives.get.useNetRequest({ shipId });
	const sortedObjectives = objectives
		.concat()
		.sort((a, b) => {
			if (a.state === "complete" && b.state !== "complete") return -1;
			if (a.state !== "complete" && b.state === "complete") return 1;
			if (a.priority > b.priority) return -1;
			if (a.priority < b.priority) return 1;
			return 0;
		})
		.reverse();
	return (
		<div className="h-screen">
			<h1 className="font-black text-2xl @2xl:text-4xl">Mission Objectives</h1>
			<div className="@2xl:panel @2xl:panel-alert flex flex-col h-full max-w-screen-md mx-auto gap-4 @2xl:p-4">
				{sortedObjectives.length === 0 ? (
					<p>No objectives.</p>
				) : (
					sortedObjectives.map((objective) => (
						<Objective key={objective.id} {...objective} />
					))
				)}
			</div>
		</div>
	);
}
