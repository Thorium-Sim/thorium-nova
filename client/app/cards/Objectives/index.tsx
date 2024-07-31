import { q } from "@client/context/AppContext";
import { cn } from "@client/utils/cn";

export function Objectives() {
	const [objectives] = q.objectives.get.useNetRequest({});
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
		<div>
			<h1 className="font-black text-lg @2xl:text-4xl">Mission Objectives</h1>
			<div className="@2xl:panel @2xl:panel-alert flex flex-col h-full max-w-screen-md mx-auto gap-4 @2xl:p-4">
				{sortedObjectives.map((objective) => (
					<div
						key={objective.id}
						className={cn("flex items-start gap-2", {
							"text-white/70":
								objective.state === "cancelled" ||
								objective.state === "complete",
						})}
					>
						<button
							type="button"
							className={cn(
								"mt-1 cursor-default flex items-center justify-center w-8 h-8 @2xl:w-10 @2xl:h-10 rounded-full border border-white",
								{
									"border-red-500 border-2": objective.state === "cancelled",
									"relative after:block after:absolute after:inset-1 after:bg-white/40 after:hover:bg-white/60 cursor-pointer after:rounded-full":
										objective.crewComplete,
									"border-green-500 border-2 after:hidden":
										objective.state === "complete",
								},
							)}
							onClick={
								objective.crewComplete && objective.state !== "cancelled"
									? () =>
											q.objectives.setState.netSend({
												objectiveId: objective.id,
												state:
													objective.state === "active" ? "complete" : "active",
											})
									: () => null
							}
						>
							{objective.state === "complete" ? (
								<div className="w-6 @2xl:w-8 aspect-square rounded-full bg-green-500" />
							) : null}
						</button>
						<div className="flex-1">
							<h3
								className={cn("@2xl:text-lg font-bold", {
									"line-through": objective.state === "cancelled",
								})}
							>
								{objective.title}
							</h3>
							<p className="text-sm @2xl:text-base">{objective.description}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
