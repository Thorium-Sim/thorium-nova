import { q } from "@client/context/AppContext";
import { Combobox, Transition } from "@headlessui/react";
import { Fragment, useReducer, useState } from "react";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";
import type z from "zod";
import { parseSchema } from "@server/utils/zodAutoForm";
import {
	ValueInput,
	getObject,
} from "@client/components/Config/EntityQueryBuilder";
import produce from "immer";
import type { components } from "@server/components";
import type { ValueQuery } from "@server/classes/Plugins/Timeline";
import { matchSorter } from "match-sorter";
import { cn } from "@client/utils/cn";
import { Icon } from "@thorium/ui/Icon";

type ZodType = typeof z;
declare global {
	interface Window {
		z: typeof z;
	}
	// biome-ignore lint/suspicious/noRedeclare:
	var z: ZodType;
}

export type ActionState = {
	action: string;
	name: string;
	values: Record<string, string | ValueQuery>;
};
export type ActionAction =
	| { type: "addAction" }
	| {
			type: "setAction";
			path?: string;
			name: string;
			action: string;
			input: any;
	  }
	| { type: "removeAction"; path: string }
	| { type: "add"; path?: string }
	| { type: "remove"; path: string }
	| { type: "component"; path: string; value: keyof typeof components | "" }
	| {
			type: "property";
			path: string;
			value: string;
			comparison: string | null;
	  }
	| { type: "comparison"; path: string; value: string | null }
	| { type: "value"; path: string; value: string | ValueQuery }
	| { type: "matchType"; path: string; value: "all" | "first" | "random" };

function actionReducer(
	state: ActionState[],
	action: ActionAction,
): ActionState[] {
	switch (action.type) {
		case "addAction":
			return [...state, { action: "", name: "", values: {} }];
		case "setAction":
			return produce(state, (draft) => {
				getObject(draft, action.path || "").name = action.name;
				getObject(draft, action.path || "").name = action.action;
				getObject(draft, action.path || "").input = action.input;
			});

		case "removeAction":
			return produce(state, (draft) => {
				draft.splice(Number(action.path), 1);
			});

		case "add":
			return produce(state, (draft) => {
				getObject(draft, action.path || "").push({
					component: "",
					property: "",
					comparison: null,
					value: "",
				});
			});
		case "remove":
			return produce(state, (draft) => {
				const path = action.path.split(".").slice(0, -1).join(".");
				let index: number | string | undefined = action.path.split(".").pop();
				index = Number.isNaN(Number(index)) ? index : Number(index);
				getObject(draft, path).splice(index, 1);
			});
		case "component":
			return produce(state, (draft) => {
				getObject(draft, action.path).component = action.value;
				getObject(draft, action.path).property = "isPresent";
				getObject(draft, action.path).comparison = null;
			});

		case "property":
			return produce(state, (draft) => {
				getObject(draft, action.path).property = action.value;
				getObject(draft, action.path).comparison = action.comparison;
			});
		case "comparison":
			return produce(state, (draft) => {
				getObject(draft, action.path).comparison = action.value;
			});
		case "value":
			return produce(state, (draft) => {
				const path = action.path.split(".").slice(0, -1).join(".");
				const property = action.path.split(".").pop()!;
				getObject(draft, path)[property] = action.value;
			});
		case "matchType":
			return produce(state, (draft) => {
				getObject(draft, action.path).matchType = action.value;
			});
		default:
			return state;
	}
}

export function ActionBuilder() {
	const [availableActions] = q.thorium.actions.useNetRequest();
	const [actions, dispatch] = useReducer(actionReducer, [
		{
			...availableActions[0],
			values: {},
		},
	]);

	return (
		<div className="flex flex-col gap-2">
			{actions.map((action, i) => (
				<ActionInput
					key={i}
					action={action}
					input={
						availableActions.find((a) => a.action === action.action)?.input
					}
					dispatch={dispatch}
					path={`${i}`}
				/>
			))}
			<button
				className="btn btn-primary btn-xs max-w-fit"
				onClick={() => dispatch({ type: "addAction" })}
			>
				Add Action
			</button>
		</div>
	);
}

export function ActionCombobox({
	value,
	onChange,
	placeholder = "Actions",
	className,
}: {
	value: {
		name: string;
		action: string;
		input?: any;
	} | null;
	onChange: (value: { name: string; action: string; input?: any }) => void;
	placeholder?: string;
	className?: string;
}) {
	const [availableActions] = q.thorium.actions.useNetRequest();

	const [query, setQuery] = useState("");

	const filteredActions = matchSorter(availableActions, query, {
		keys: ["name", "action"],
	});

	return (
		<Combobox value={value} onChange={onChange}>
			<div className={cn("relative flex-1", className)}>
				<div className="cursor-pointer min-h-6 h-6 leading-5 relative border-success border rounded-lg">
					<Combobox.Input
						placeholder={placeholder}
						className="w-full bg-transparent placeholder:text-success placeholder:font-semibold text-success border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5"
						onChange={(event) => setQuery(event.target.value)}
						autoComplete="off"
						// @ts-expect-error The types are wrong
						displayValue={(event) => event?.name}
					/>
					<Combobox.Button className="absolute w-10 bg-success/20 hover:bg-success/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
						<Icon
							name="chevrons-up-down"
							className="w-5 h-5 text-success"
							aria-hidden="true"
						/>
					</Combobox.Button>
				</div>
				<Transition
					as={Fragment}
					leave="transition ease-in duration-100"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
					afterLeave={() => setQuery("")}
				>
					<Combobox.Options className="absolute w-full mt-1 overflow-auto text-base bg-gray-900/90 border-gray-400 border rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
						{filteredActions.length === 0 && query !== "" ? (
							<div className="cursor-default select-none relative py-1 px-1 text-gray-300">
								Nothing found.
							</div>
						) : (
							filteredActions.map((action) => (
								<Combobox.Option
									key={action.name}
									className={({ active }: { active: boolean }) =>
										`cursor-default select-none relative py-1 px-2 ${
											active ? "text-white bg-success" : ""
										}`
									}
									value={action}
								>
									<span className={`block truncate font-normal`}>
										{action.name}
									</span>
								</Combobox.Option>
							))
						)}
					</Combobox.Options>
				</Transition>
			</div>
		</Combobox>
	);
}

export function ActionInput({
	action,
	input,
	dispatch,
	path,
}: {
	action: ActionState;
	input: any;
	dispatch: React.Dispatch<ActionAction>;
	path: string;
}) {
	const actionSchema = action
		? // biome-ignore lint/security/noGlobalEval:
		  parseSchema(eval(parseJsonSchema(input)))
		: null;

	return (
		<>
			{actionSchema?.map((item) => {
				const value = action.values[item.key];
				return (
					<ValueInput
						key={item.key}
						value={value}
						item={item}
						dispatch={dispatch}
						path={path}
					/>
				);
			})}
		</>
	);
}
