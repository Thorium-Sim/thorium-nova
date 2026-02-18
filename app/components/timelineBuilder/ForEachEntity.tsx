import {
	type BlockProps,
	EntityInput,
	ValueInput,
} from "@thorium/components/timelineBuilder/BlockInputs";

export function ForEachEntity({
	entity,
	variable,
	update,
}: BlockProps<"ForEachEntity">) {
	return (
		<div className="flex items-center gap-1">
			Loop over each{" "}
			<span>
				entity{" "}
				<EntityInput
					value={entity}
					onChange={(value) => update("entity", value)}
				/>{" "}
				as local variable{" "}
				<ValueInput
					value={variable}
					onChange={(value) => update("variable", value)}
				/>
			</span>
		</div>
	);
}
