import { q } from "@thorium/context/AppContext";
import { cn } from "@thorium/utils/cn";

export function Objective({
	id,
	state,
	crewComplete,
	title,
	description,
	size,
}: {
	id: number;
	state: "cancelled" | "complete" | "active";
	crewComplete: boolean;
	title: string;
	description?: string;
	size?: "sm";
}) {
	return (
		<div
			key={id}
			className={cn("flex items-start gap-2", {
				"text-white/70": state === "cancelled" || state === "complete",
			})}
		>
			<button
				type="button"
				className={cn(
					"mt-1 cursor-default flex items-center justify-center aspect-square @[14rem]:w-4 @[14rem]:h-4  @2xl:w-10 @2xl:h-10 rounded-full border border-white",
					{
						"border-red-500 border-2": state === "cancelled",
						"relative after:block after:absolute after:inset-1 after:bg-white/40 after:hover:bg-white/60 cursor-pointer after:rounded-full":
							crewComplete,
						"border-green-500 border-2 after:hidden": state === "complete",
					},
				)}
				onClick={
					crewComplete && state !== "cancelled"
						? () =>
								q.objectives.setState.netSend({
									objectiveId: id,
									state: state === "active" ? "complete" : "active",
								})
						: () => null
				}
			>
				{state === "complete" ? (
					<div className="w-6 @2xl:w-8 aspect-square rounded-full bg-green-500" />
				) : null}
			</button>
			<div className="flex-1">
				<h3
					className={cn("text-base font-medium @2xl:text-lg @2xl:font-bold", {
						"line-through": state === "cancelled",
					})}
				>
					{title}
				</h3>
				{size === "sm" ? null : (
					<p className="text-sm @2xl:text-base">{description}</p>
				)}
			</div>
		</div>
	);
}
