import {
	MadLibSelect,
	ValueInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";

export function DebugBlock({ update, variable }: BlockProps<"Debug">) {
	return (
		<div className="flex items-center gap-x-1 gap-y-5 flex-wrap">
			Save print local variable{" "}
			<ValueInput
				value={variable}
				onChange={(value) => update("variable", value)}
			/>{" "}
			to the server console.
		</div>
	);
}
