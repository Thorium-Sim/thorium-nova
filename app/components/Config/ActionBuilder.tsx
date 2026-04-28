import type { ValueQuery } from "@thorium/.server/classes/Plugins/TimelineStep";
import { ValueInput } from "@thorium/components/Config/EntityQueryBuilder";
import { q } from "@thorium/context/AppContext";
import type { components } from "@thorium/ecs-components";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { parseSchema } from "@thorium/utils/zodAutoForm";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";
import { matchSorter } from "match-sorter";
import { Fragment, useState } from "react";
import {
	Button,
	ComboBox,
	Group,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";
import type { Key } from "react-aria-components";
import z from "zod";

declare global {
	interface Window {
		z: typeof z;
	}
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
	const [selectedKey, setSelectedKey] = useState<Key | null>(null);
	const filteredActions = matchSorter(availableActions, query, {
		keys: ["name", "action"],
	}).map((a) => ({ ...a, key: a.action }));

	return (
		<ComboBox
			className="group flex flex-col gap-1"
			inputValue={query}
			onInputChange={setQuery}
			selectedKey={selectedKey}
			allowsCustomValue={false}
			onSelectionChange={(key) => {
				setSelectedKey(key);
				onChange(availableActions.find((a) => a.action === key)!);
				setQuery("");
			}}
			aria-label={placeholder}
		>
			<Group className="border-success flex h-6 min-h-6 rounded-lg border shadow-md ring-1 ring-black/10 transition focus-visible:ring-2 focus-visible:ring-black">
				<Input
					placeholder={value?.name || placeholder}
					className="placeholder:text-success text-success w-full min-w-56 flex-1 border-none bg-transparent px-3 py-2 pr-0 pl-3 text-xs leading-5 outline-none placeholder:font-semibold focus:ring-0"
				/>
				<Button className="text-success border-l-success pressed:bg-success/50 bg-success/20 hover:bg-success/50 flex cursor-pointer items-center rounded-r-lg border-0 border-l border-solid px-3 transition">
					<Icon name="chevrons-up-down" />
				</Button>
			</Group>
			<Popover className="entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out max-h-60 w-(--trigger-width) overflow-auto rounded-md border border-gray-400 bg-gray-900/90 text-base shadow-lg ring-1 ring-black/5">
				<ListBox className="p-1 outline-hidden" items={filteredActions}>
					{(item) => (
						<ListBoxItem
							textValue={item.name}
							key={item.key}
							className="group flex cursor-default items-center gap-0.5 rounded-sm text-gray-900 outline-hidden select-none focus:bg-sky-600 focus:text-white"
						>
							{({ isFocusVisible, isHovered }) => (
								<>
									<span
										className={cn(
											"flex-1 flex items-center gap-1 truncate font-normal group-selected:font-medium text-white py-1 pl-1 pr-2 rounded",
											{
												"text-white bg-success": isFocusVisible,
												" bg-success/40": isHovered,
											},
										)}
									>
										{item.name}
									</span>
								</>
							)}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
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
		? // oxlint-disable-next-line no-eval
			parseSchema(eval(parseJsonSchema(input)), overrides)
		: [];

	const inputs = [];
	const queryInputs: string[] = [];
	for (const item of actionSchema) {
		const value = item.key.split(".").reduce((acc: any, key) => acc?.[key], action.values);

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
