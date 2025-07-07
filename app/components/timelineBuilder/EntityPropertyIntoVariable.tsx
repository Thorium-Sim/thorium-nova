import {
	EntityInput,
	ComponentPropertySelect,
	ValueInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";

export function EntityPropertyIntoVariable({
	entity,
	component,
	property,
	variable,
	update,
}: BlockProps<"EntityPropertyIntoVariable">) {
	return (
		<div className="flex items-center gap-1 gap-x-1 gap-y-5 whitespace-nowrap flex-wrap">
			Save property{" "}
			<ComponentPropertySelect
				onlyShowProperties
				component={component}
				property={property}
				setComponent={(value) => update("component", value)}
				setProperty={(value) => update("property", value)}
			/>{" "}
			from{" "}
			<span>
				entity{" "}
				<EntityInput
					value={entity}
					onChange={(value) => update("entity", value)}
				/>
			</span>
			as{" "}
			<span>
				local variable{" "}
				<ValueInput
					value={variable}
					onChange={(value) => update("variable", value)}
				/>
			</span>
		</div>
	);
}
