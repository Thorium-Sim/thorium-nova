import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { Fragment, useId } from "react";
import { getInputType, parseSchema } from "@thorium/utils/zodAutoForm";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";
import {
	ActionCombobox,
	type ActionAction,
	type ActionState,
} from "@thorium/components/Config/ActionBuilder";
import { q } from "@thorium/context/AppContext";
import {
	Button as RAButton,
	Disclosure,
	Heading,
	DisclosurePanel,
} from "react-aria-components";
import { PropertyInput } from "@thorium/components/Config/EntityQueryBuilder";
import type { BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";

export function ActionBlock({ action, values, update }: BlockProps<"Action">) {
	const [availableActions] = q.thorium.actions.useNetRequest();
	const chosenAction =
		availableActions.find((a) => a.action === action) || null;
	return (
		<Disclosure>
			<Heading className="flex items-center gap-1">
				Run action{" "}
				<ActionCombobox
					value={chosenAction}
					onChange={(value) => update("action", value.action)}
					placeholder="Pick Action"
				/>
				{chosenAction && (
					<RAButton
						aria-label="Configure Action"
						slot="trigger"
						className="btn btn-outline btn-primary btn-xs"
					>
						<Icon name="settings" />
					</RAButton>
				)}
			</Heading>
			<DisclosurePanel className="flex flex-col gap-2 w-full">
				{chosenAction ? (
					<ActionInput
						action={{ ...chosenAction, values }}
						dispatch={(params) => {
							if (params.type === "value") {
								update("values", {
									...values,
									[params.path]: params.value,
								});
							}
						}}
					/>
				) : (
					<div>Choose an action</div>
				)}
			</DisclosurePanel>
		</Disclosure>
	);
}

const voices =
	typeof window === "undefined"
		? []
		: window.speechSynthesis
				.getVoices()
				.filter((s) => s.lang === navigator.language)
				.map((s) => s.name);

function ActionValueInput({
	value,
	item,
	dispatch,
}: {
	value: string | undefined;
	item: {
		key: string;
		name: string;
		type: any;
		values: any;
		helper?: string;
		inputProps: React.InputHTMLAttributes<HTMLInputElement>;
		isNested: boolean;
	};
	dispatch: React.Dispatch<ActionAction>;
}) {
	const id = useId();
	// Special override for the voice input
	if (item.key.endsWith("voice")) {
		return (
			<div className={item.isNested ? "value-input-is-nested" : ""}>
				<label htmlFor={id}>{item.name}</label>
				<PropertyInput
					id={id}
					inputType="select"
					inputValues={voices}
					value={value}
					setValue={(value) =>
						dispatch({
							type: "value",
							path: item.key,
							value,
						})
					}
					label={item.name}
					labelHidden
					{...item.inputProps}
				/>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-end",
				item.isNested ? "value-input-is-nested" : "",
			)}
		>
			<div className="flex-1">
				<label htmlFor={id}>{item.name}</label>
				<PropertyInput
					id={id}
					inputType={getInputType(item, "=")}
					label={item.name}
					labelHidden
					inputValues={item.values}
					setValue={(value) =>
						dispatch({
							type: "value",
							path: item.key,
							value,
						})
					}
					value={value}
					{...item.inputProps}
				/>
			</div>
		</div>
	);
}

function ActionInput({
	action,
	dispatch,
	input,
}: {
	action: ActionState;
	dispatch: React.Dispatch<ActionAction>;
	input?: any;
}) {
	const [availableActions] = q.thorium.actions.useNetRequest();
	const actionDef = availableActions.find((a) => a.action === action.action);
	input = input || actionDef?.input;
	const overrides = actionDef?.actionOverrides || {};
	const actionSchema = action
		? // biome-ignore lint/security/noGlobalEval: Eval is necessary
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
				<ActionValueInput value={value} item={item} dispatch={dispatch} />
				{item.helper && <p className="text-xs text-gray-400">{item.helper}</p>}
			</Fragment>,
		);
	}

	return inputs;
}
