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
}: BlockProps<"Macro"> & { replace: (blocks: TimelineBlock[]) => void }) {
	const [macro] = q.plugin.macro.get.useNetRequest({ pluginId, macroId });

	return (
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
					Macro <code className="text-purple-200">{macroId}</code> not found in
					plugin <code className="text-purple-200">{pluginId}</code>.
				</>
			)}
		</div>
	);
}
