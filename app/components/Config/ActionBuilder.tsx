import { q } from "@thorium/context/AppContext";
import { Fragment, useEffect, useState } from "react";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";
// biome-ignore lint/style/useImportType: <explanation>
import z from "zod";
import { parseSchema } from "@thorium/utils/zodAutoForm";
import { ValueInput } from "@thorium/components/Config/EntityQueryBuilder";
import type { components } from "@thorium/ecs-components";
import type { ValueQuery } from "@thorium/.server/classes/Plugins/TimelineStep";
import { matchSorter } from "match-sorter";
import { cn } from "@thorium/utils/cn";
import { Icon } from "@thorium/ui/Icon";
import {
	Button,
	ComboBox,
	Group,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";
import type { Key } from "react-aria-components";

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
			<Group className="flex rounded-lg border-success border transition shadow-md ring-1 min-h-6 h-6 ring-black/10 focus-visible:ring-2 focus-visible:ring-black">
				<Input
					placeholder={value?.name || placeholder}
					className="flex-1 w-full min-w-56 border-none py-2 px-3 leading-5 placeholder:text-success placeholder:font-semibold text-success bg-transparent outline-none focus:ring-0 pl-3 pr-0 text-xs "
				/>
				<Button className="px-3 flex items-center text-success transition border-0 border-solid border-l border-l-success rounded-r-lg pressed:bg-success/50 bg-success/20 hover:bg-success/50 cursor-pointer">
					<Icon name="chevrons-up-down" />
				</Button>
			</Group>
			<Popover className="max-h-60 w-(--trigger-width) overflow-auto rounded-md bg-gray-900/90 border-gray-400 border text-base shadow-lg ring-1 ring-black/5 entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out">
				<ListBox className="outline-hidden p-1" items={filteredActions}>
					{(item) => (
						<ListBoxItem
							textValue={item.name}
							key={item.key}
							className="group flex items-center gap-0.5 cursor-default select-none outline-hidden rounded-sm text-gray-900 focus:bg-sky-600 focus:text-white"
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
