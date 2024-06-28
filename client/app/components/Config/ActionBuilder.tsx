import { q } from "@client/context/AppContext";
import { Combobox, Transition } from "@headlessui/react";
import { Fragment, useReducer, useState } from "react";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";
// biome-ignore lint/style/useImportType: <explanation>
import z from "zod";
import { parseSchema } from "@server/utils/zodAutoForm";
import { ValueInput } from "@client/components/Config/EntityQueryBuilder";
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
if (typeof window !== "undefined") {
	window.z = z;
}

export type ActionState = {
	action: string;
	name: string;
	values: Record<string, string | ValueQuery>;
};
export type ActionAction =
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
	dispatch,
	path,
	input,
}: {
	action: ActionState;
	dispatch: React.Dispatch<ActionAction>;
	path: string;
	input?: any;
}) {
	const [availableActions] = q.thorium.actions.useNetRequest();
	const actionDef = availableActions.find((a) => a.action === action.action);
	input = input || actionDef?.input;
	const overrides = actionDef?.actionOverrides || {};
	const actionSchema = action
		? // biome-ignore lint/security/noGlobalEval:
		  parseSchema(eval(parseJsonSchema(input)), overrides)
		: [];

	const inputs = [];
	const queryInputs: string[] = [];
	for (const item of actionSchema) {
		const value = item.key
			.split(".")
			.reduce((acc: any, key) => acc?.[key], action.values);

		if (value && typeof value === "object" && "query" in value) {
			queryInputs.push(item.key);
		}
		const hasQueryInputParent = queryInputs.some((queryInput) =>
			item.key.includes(`${queryInput}.`),
		);
		if (hasQueryInputParent) continue;
		inputs.push(
			<Fragment key={item.key}>
				<ValueInput value={value} item={item} dispatch={dispatch} path={path} />
				{item.helper && <p className="text-xs text-gray-400">{item.helper}</p>}
			</Fragment>,
		);
	}

	return inputs;
}
