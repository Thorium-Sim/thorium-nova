import { q } from "@thorium/context/AppContext";
import useEventListener from "@thorium/hooks/useEventListener";
import Button from "@thorium/ui/Button";
import { useState } from "react";

export class ChooseActionEvent extends Event {
	static name = "ChooseActionEvent";
	constructor(public addBlockId: string) {
		super(ChooseActionEvent.name);
	}
}

export class AddActionEvent extends Event {
	static name = "AddActionEvent";
	constructor(
		public addBlockId: string,
		public type: "action" | "event",
		public blockName: string,
		public values: any,
	) {
		super(AddActionEvent.name);
	}
}

export function EventsCore() {
	const [choosing, setChoosing] = useState<string | null>(null);
	useEventListener(ChooseActionEvent.name, (event: ChooseActionEvent) => {
		setChoosing(event.addBlockId);
	});

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
					<p key={i} className="relative w-full overflow-x-auto whitespace-nowrap">
						{e.name} - <code>{JSON.stringify(e.values)}</code>
						{choosing ? (
							<Button
								className="btn-success btn-xs absolute right-0"
								onClick={() => {
									window.dispatchEvent(new AddActionEvent(choosing, "event", e.name, e.values));
									setChoosing(null);
								}}
							>
								Add
							</Button>
						) : null}
					</p>
				))}
			</div>
			<p>Actions</p>
			<div className="flex flex-auto flex-col-reverse overflow-y-auto">
				{actions.map((e, i) => (
					<p key={i} className="relative overflow-x-auto whitespace-nowrap">
						{e.name} - <code>{JSON.stringify(e.values)}</code>
						{choosing ? (
							<Button
								className="btn-success btn-xs"
								onClick={() => {
									window.dispatchEvent(new AddActionEvent(choosing, "action", e.name, e.values));
									setChoosing(null);
								}}
							>
								Add
							</Button>
						) : null}
					</p>
				))}
			</div>
		</div>
	);
}
