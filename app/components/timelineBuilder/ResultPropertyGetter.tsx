import {
	MadLibsCombobox,
	ValueInput,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { q } from "@thorium/context/AppContext";
import { Tooltip } from "@thorium/ui/Tooltip";
import { parseSchema } from "@thorium/utils/zodAutoForm";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";

export function ResultPropertyIntoVariable({
	property,
	variable,
	previousActionOrEventBlock,
	update,
}: BlockProps<"ResultPropertyIntoVariable"> & {
	previousActionOrEventBlock: TimelineBlock | undefined;
}) {
	const [availableActions] = q.thorium.actions.useNetRequest();
	const [availableEvents] = q.thorium.events.useNetRequest();
	const previousAction = availableActions.find(
		(a) =>
			previousActionOrEventBlock?.type === "Action" &&
			a.action === previousActionOrEventBlock.action,
	);
	const previousEvent = availableEvents.find(
		(a) =>
			previousActionOrEventBlock?.type === "EventCondition" &&
			a.event === previousActionOrEventBlock.event,
	);
	const actionOutputSchema = previousAction
		? // oxlint-disable-next-line no-eval
			parseSchema(eval(parseJsonSchema(previousAction.output)), {})
		: previousEvent
			? // oxlint-disable-next-line no-eval
				parseSchema(eval(parseJsonSchema(previousEvent.output)))
			: [];

	return (
		<>
			<div className="flex flex-wrap items-center gap-x-1 gap-y-5">
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
					content={previousAction?.action || previousEvent?.event || "No previous action or event"}
					className="text-purple-200"
				>
					the result
				</Tooltip>{" "}
				as local variable{" "}
				<ValueInput value={variable} onChange={(value) => update("variable", value)} />
			</div>
			{previousAction || previousEvent ? null : (
				<small>
					There isn't any action block before this block, so there isn't any result to pick a
					property from.
				</small>
			)}
			{(previousAction || previousEvent) && actionOutputSchema.length === 0 ? (
				<small>
					There aren't any output properties from the previous {previousAction?.action} action
				</small>
			) : null}
		</>
	);
}
