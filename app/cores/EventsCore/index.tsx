import { q } from "@thorium/context/AppContext";
import { useState } from "react";

export function EventsCore() {
	const [events, setEvents] = useState<{ name: string; values: any }[]>([]);
	const [actions, setActions] = useState<{ name: string; values: any }[]>([]);
	q.thorium.eventsSub.useNetSubscribe(
		undefined,
		(event) => event && setEvents((e) => [...e, { name: event.name, values: event.values }]),
	);
	q.thorium.actionsSub.useNetSubscribe(
		undefined,
		(action) => action && setActions((e) => [...e, { name: action.name, values: action.values }]),
	);

	return (
		<div className="flex h-full flex-col text-sm">
			<p>Events</p>
			<div className="flex flex-auto flex-col-reverse overflow-y-auto">
				{events.map((e, i) => (
					<p key={i} className="whitespace-nowrap overflow-x-auto">
						{e.name} - <code>{JSON.stringify(e.values)}</code>
					</p>
				))}
			</div>
			<p>Actions</p>
			<div className="flex flex-auto flex-col-reverse overflow-y-auto">
				{actions.map((e, i) => (
					<p key={i} className="whitespace-nowrap overflow-x-auto">
						{e.name} - <code>{JSON.stringify(e.values)}</code>
					</p>
				))}
			</div>
		</div>
	);
}
