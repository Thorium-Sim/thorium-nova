import { ValueInput, type BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";

export function DebugBlock({ update, debugVariable }: BlockProps<"Debug">) {
	return (
		<div className="flex flex-wrap items-center gap-x-1 gap-y-5">
			Save print local variable{" "}
			<ValueInput value={debugVariable} onChange={(value) => update("debugVariable", value)} /> to the server
			console.
		</div>
	);
}
