import type { TimelineBlock } from "@thorium/.server/classes/Plugins/TimelineBlockTypes";
import { q } from "@thorium/context/AppContext";
import {
	MadLibsCombobox,
	ValueInput,
	type BlockProps,
} from "@thorium/routes/config/timelines/builder/BlockInputs";
import { Tooltip } from "@thorium/ui/Tooltip";
import { parseSchema } from "@thorium/utils/zodAutoForm";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";

export function ResultPropertyIntoVariable({
	property,
	variable,
	previousActionBlock,
	update,
}: BlockProps<"ResultPropertyIntoVariable"> & {
	previousActionBlock: TimelineBlock | undefined;
}) {
	const [availableActions] = q.thorium.actions.useNetRequest();
	const previousAction = availableActions.find(
		(a) =>
			previousActionBlock?.type === "Action" &&
			a.action === previousActionBlock.action,
	);
	const actionOutputSchema = previousAction
		? // biome-ignore lint/security/noGlobalEval:
			parseSchema(eval(parseJsonSchema(previousAction.output)), {})
		: [];
	console.log(actionOutputSchema);
	return (
		<>
			<div className="flex items-center gap-x-1 gap-y-5 flex-wrap">
				{/* TODO June 12, 2025 - Turn this into a combobox based on what the result type is, eg. action parameters, event parameters, etc. */}
				Save property{" "}
				<MadLibsCombobox
					placeholder="Property"
					items={actionOutputSchema.map((c) => ({ id: c.key }))}
					value={property}
					onChange={(value) => update("property", value)}
				/>{" "}
				from{" "}
				<Tooltip
					content={previousAction?.action || "No previous action"}
					className="text-purple-200"
				>
					the result
				</Tooltip>{" "}
				as local variable{" "}
				<ValueInput
					value={variable}
					onChange={(value) => update("variable", value)}
				/>
			</div>
			{previousAction ? null : (
				<small>
					There isn't any action block before this block, so there isn't any
					result to pick a property from.
				</small>
			)}
			{actionOutputSchema.length === 0 ? (
				<small>
					There aren't any output properties from the previous{" "}
					{previousAction?.action} action
				</small>
			) : null}
		</>
	);
}
