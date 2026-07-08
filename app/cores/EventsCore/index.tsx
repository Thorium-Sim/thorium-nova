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
		(event) => event && setEvents((e) => [{ name: event.name, values: event.values }, ...e]),
	);
	q.thorium.actionsSub.useNetSubscribe(
		undefined,
		(action) => action && setActions((e) => [{ name: action.name, values: action.values }, ...e]),
	);

	return (
		<div className="flex h-full text-sm">
			<div className="flex h-full max-w-1/2 grow flex-col">
				<p>Events</p>
				<div className="relative flex min-h-0 flex-col overflow-y-auto">
					{events.map((e, i) => (
						<div key={i} className="relative border-b border-b-white/50 last-of-type:border-0">
							<p className="text-sm font-bold">{e.name}</p>
							{Object.entries(e.values).map(([key, value]) => (
								<p key={key} className="text-xs">
									{/* @ts-expect-error */}
									<span className="font-medium">{key}:</span>{" "}
									{Array.isArray(value)
										? value.join(", ")
										: typeof value === "object"
											? JSON.stringify(value)
											: value}
								</p>
							))}
							{choosing ? (
								<Button
									className="btn-success btn-xs absolute top-0 right-0"
									onClick={() => {
										window.dispatchEvent(new AddActionEvent(choosing, "event", e.name, e.values));
										setChoosing(null);
									}}
								>
									Add
								</Button>
							) : null}
						</div>
					))}
				</div>
			</div>
			<div className="flex h-full max-w-1/2 grow flex-col">
				<p>Actions</p>
				<div className="relative flex min-h-0 flex-col-reverse overflow-y-auto">
					{actions.map((e, i) => (
						<div key={i} className="relative border-b border-b-white/50 last-of-type:border-0">
							<p className="text-sm font-bold">{e.name}</p>
							{Object.entries(e.values).map(([key, value]) => (
								<p key={key} className="text-xs">
									{/* @ts-expect-error */}
									<span className="font-medium">{key}:</span> {value}
								</p>
							))}
							{choosing ? (
								<Button
									className="btn-success btn-xs absolute top-0 right-0"
									onClick={() => {
										window.dispatchEvent(new AddActionEvent(choosing, "action", e.name, e.values));
										setChoosing(null);
									}}
								>
									Add
								</Button>
							) : null}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
