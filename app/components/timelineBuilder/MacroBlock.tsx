import { type BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { q } from "@thorium/context/AppContext";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";

function noop() {}
export function MacroBlock({
	pluginId,
	macroId,
	replace,
	definedVariables,
	macro: isMacro,
}: BlockProps<"Macro"> & {
	replace: (blocks: TimelineBlock[]) => void;
	definedVariables: string[];
	macro?: boolean;
}) {
	const [macro] = q.plugin.macro.get.useNetRequest({ pluginId, macroId });

	const missingRequiredVariables = getRequiredVariables(macro.blocks, definedVariables);

	return (
		<div>
			<div className="flex flex-wrap items-center gap-x-1 gap-y-5">
				{macro ? (
					<>
						Run macro
						<DialogTrigger>
							<Button>
								<code className="text-purple-200">{macro.name}</code>
							</Button>
							<Popover className={popoverTransitionClasses}>
								<Dialog className="isolate -translate-y-1/4 scale-50 rounded border border-white/50 bg-black/70 p-2 text-white">
									<SortableBlocks
										macro={isMacro}
										blocks={macro.blocks}
										executionType={["main", "prerequisite"]}
										onDragEnd={noop}
										onUpdate={noop}
										onRemove={noop}
										onReplace={noop}
									/>
								</Dialog>
							</Popover>
						</DialogTrigger>{" "}
						<Tooltip content="Expand macro into blocks">
							<button
								className="btn btn-outline btn-xs btn-info"
								onClick={() => {
									replace(macro.blocks);
								}}
							>
								<Icon name="unfold-vertical" />
							</button>
						</Tooltip>
					</>
				) : (
					<>
						Macro <code className="text-purple-200">{macroId}</code> not found in plugin{" "}
						<code className="text-purple-200">{pluginId}</code>.
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

function getRequiredVariables(blocks: TimelineBlock[], definedVariables: string[] = []): string[] {
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
			for (const value of getRequiredVariables(block.triggerBlocks, definedVariables)) {
				output.push(value);
			}
		}
	}
	return output.filter((a, i, arr) => arr.indexOf(a) === i && !definedVariables.includes(a));
}
