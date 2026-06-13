import { EventCombobox } from "@thorium/components/Config/EventCombobox";
import type { BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";
import { q } from "@thorium/context/AppContext";
import Checkbox from "@thorium/ui/Checkbox";
import InfoTip from "@thorium/ui/InfoTip";
import uniqid from "@thorium/utils/uniqid";
import { parseSchema } from "@thorium/utils/zodAutoForm";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";

export function EventCondition({
	event,
	multiple,
	persist,
	update,
	triggerBlocks,
}: BlockProps<"EventCondition">) {
	const [availableEvents] = q.thorium.events.useNetRequest();
	const eventObject = availableEvents.find((ev) => ev.event === event) || null;
	return (
		<>
			<div className="flex items-center gap-1">
				Wait until{" "}
				<EventCombobox
					value={eventObject}
					onChange={async (value) => {
						await update("event", value.event);

						const event = availableEvents.find((e) => e.event === value.event);
						const eventSchema = event
							? // oxlint-disable-next-line no-eval
								parseSchema(eval(parseJsonSchema(event.output)), {})
							: [];
						const resultsVariables = eventSchema.map((e) => ({
							id: uniqid("blo-"),
							type: "ResultPropertyIntoVariable" as const,
							property: e.key,
							variable: e.key,
						}));
						// Replace all of the result variable trigger blocks
						await update("triggerBlocks", [
							...resultsVariables,
							...triggerBlocks.filter((t) => t.type !== "ResultPropertyIntoVariable"),
						]);
					}}
				/>{" "}
				is triggered.
			</div>
			<div className="flex gap-2">
				<Checkbox
					checked={multiple}
					onChange={(e) => update("multiple", e.currentTarget.checked)}
					label={
						<>
							Multiple{" "}
							<InfoTip>
								Set this to true to have this event handler continue triggering after the first time
								it triggers.
							</InfoTip>
						</>
					}
				/>
				<Checkbox
					checked={persist}
					onChange={(e) => update("persist", e.currentTarget.checked)}
					label={
						<>
							Persist{" "}
							<InfoTip>
								Whether this trigger condition will continue to exist after the timeline step has
								proceeded. Set this to true if you want the trigger remain active. It will still
								automatically deactivate once it has been triggered once (unless "multiple" is on).
							</InfoTip>
						</>
					}
				/>
			</div>
		</>
	);
}
