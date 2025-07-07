import {
	MadLibSelect,
	ValueInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { q } from "@thorium/context/AppContext";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";

export function MacroBlock({
	pluginId,
	macroId,
	replace,
	definedVariables,
}: BlockProps<"Macro"> & {
	replace: (blocks: TimelineBlock[]) => void;
	definedVariables: string[];
}) {
	const [macro] = q.plugin.macro.get.useNetRequest({ pluginId, macroId });

	const missingRequiredVariables = getRequiredVariables(
		macro.blocks,
		definedVariables,
	);

	return (
		<div>
			<div className="flex items-center gap-x-1 gap-y-5 flex-wrap">
				{macro ? (
					<>
						Run macro <code className="text-purple-200">{macro.name}</code>{" "}
						<Tooltip content="Expand macro into blocks">
							<button
								className="btn btn-outline btn-xs btn-info"
								onClick={() => replace(macro.blocks)}
							>
								<Icon name="unfold-vertical" />
							</button>
						</Tooltip>
					</>
				) : (
					<>
						Macro <code className="text-purple-200">{macroId}</code> not found
						in plugin <code className="text-purple-200">{pluginId}</code>.
					</>
				)}
			</div>
			{missingRequiredVariables.length > 0 ? (
				<>
					<span className="text-red-500">Missing required variables: </span>
					{missingRequiredVariables.join(", ")}
				</>
			) : null}
		</div>
	);
}

function getRequiredVariables(
	blocks: TimelineBlock[],
	definedVariables: string[] = [],
): string[] {
	const output = [];
	for (const block of blocks) {
		if ("variable" in block) {
			definedVariables.push(block.variable);
		}
		// Assume that every property value which begins with "$" is a variable
		for (const value of Object.values(block)) {
			if (typeof value === "string" && value.startsWith("$")) {
				output.push(value.replace("$", ""));
			}
			if (Array.isArray(value)) {
				for (const val of getRequiredVariables(value, definedVariables)) {
					output.push(val);
				}
			}
		}
		if ("values" in block) {
			for (const key in block.values) {
				const value = block.values[key];
				if (typeof value === "string" && value.startsWith("$")) {
					output.push(value.replace("$", ""));
				}
			}
		}
		if ("triggerBlocks" in block) {
			for (const value of getRequiredVariables(
				block.triggerBlocks,
				definedVariables,
			)) {
				output.push(value);
			}
		}
	}
	return output.filter(
		(a, i, arr) => arr.indexOf(a) === i && !definedVariables.includes(a),
	);
}
