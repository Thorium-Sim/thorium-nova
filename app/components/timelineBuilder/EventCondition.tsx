import { EventCombobox } from "@thorium/components/Config/EventCombobox";
import { q } from "@thorium/context/AppContext";
import type { BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";
import Checkbox from "@thorium/ui/Checkbox";
import InfoTip from "@thorium/ui/InfoTip";

export function EventCondition({
	event,
	multiple,
	persist,
	triggerBlocks,
	update,
}: BlockProps<"EventCondition">) {
	const [availableEvents] = q.thorium.events.useNetRequest();
	const eventObject = availableEvents.find((ev) => ev.event === event) || null;
	return (
		<>
			<div className="flex items-center gap-1">
				Wait until{" "}
				<EventCombobox
					value={eventObject}
					onChange={(value) => update("event", value.event)}
				/>{" "}
				is triggered.
			</div>
			<div className="flex gap-2 self-end">
				<Checkbox
					checked={multiple}
					onChange={(e) => update("multiple", e.currentTarget.checked)}
					label={
						<>
							Multiple{" "}
							<InfoTip>
								Set this to true to have this event handler continue triggering
								after the first time it triggers.
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
								Whether this trigger condition will continue to exist after the
								timeline step has proceeded. Set this to true if you want the
								trigger remain active. It will still automatically deactivate
								once it has been triggered once (unless "multiple" is on).
							</InfoTip>
						</>
					}
				/>
			</div>
		</>
	);
}
