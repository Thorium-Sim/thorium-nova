import { components, type ComponentIds } from "@thorium/ecs-components";
import {
	type InputTypes,
	ZOD_COMPARISONS,
	getInputType,
	parseSchema,
	schemaWithoutDefault,
} from "@thorium/utils/zodAutoForm";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { capitalCase } from "change-case";
import { type Dispatch, Fragment, useId, useState } from "react";
import { produce } from "immer";
import { Tooltip } from "@thorium/ui/Tooltip";
import type {
	ComponentQuery,
	EntityQuery,
	ValueQuery,
} from "@thorium/.server/classes/Plugins/Timeline";
import TagInput from "@thorium/ui/TagInput";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { StarmapCoordinates } from "./StarmapCoordinates";
import { ShipTemplate } from "./ShipTemplate";
import { SoundConfigForm } from "@thorium/routes/config/systems/soundId";
import {
	Button,
	ComboBox,
	ListBox,
	ListBoxItem,
	Popover,
	Input as RAInput,
} from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";

type QueryReducerAction =
	| { type: "add"; component?: keyof typeof components | ""; path?: string }
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

export function queryReducer(
	state: EntityQuery,
	action: QueryReducerAction,
): EntityQuery {
	switch (action.type) {
		case "add":
			return produce(state, (draft) => {
				getObject(draft, action.path || "").push({
					component: action.component || "",
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
				getObject(draft, action.path).value = action.value;
			});
		case "matchType":
			return produce(state, (draft) => {
				getObject(draft, action.path).matchType = action.value;
			});
		default:
			return state;
	}
}

export function getObject(object: any, path: string | null) {
	if (!path) return object;
	const paths = path
		.split(".")
		.map((p) => (Number.isNaN(Number(p)) ? p : Number(p)));
	const target =
		paths.reduce((obj, key) => {
			if (!obj[key]) obj[key] = typeof key === "number" ? [] : {};
			return obj[key];
		}, object) || object;
	return target;
}

const matchItems = [
	{ id: "all", label: "All Matches" },
	{ id: "first", label: "First Match" },
	{ id: "random", label: "Random Match" },
];

function QueryComponent({
	component,
	property,
	value,
	comparison,
	path,
	dispatch,
	showDelete,
}: Omit<ComponentQuery, "value" | "comparison"> &
	Partial<Pick<ComponentQuery, "value" | "comparison">> & {
		path: string;
		dispatch: Dispatch<QueryReducerAction>;
		showDelete: boolean;
	}) {
	const item = component
		? parseSchema(schemaWithoutDefault(component as ComponentIds)).find(
				(p) => p.key === property,
			)
		: null;

	const isSelect = path.endsWith(".select");
	return (
		<div className="flex gap-2 items-end flex-wrap">
			<ComponentCombobox
				component={component as ComponentIds}
				onChange={(value) => {
					dispatch({ type: "component", path, value });
				}}
				isSelect={isSelect}
			/>
			<PropertyCombobox
				component={component as ComponentIds}
				property={property}
				onChange={(value) => {
					const item = component
						? parseSchema(schemaWithoutDefault(component as ComponentIds)).find(
								(p) => p.key === value,
							)
						: null;
					const comparison =
						ZOD_COMPARISONS[item?.type as keyof typeof ZOD_COMPARISONS]?.[0] ||
						null;

					dispatch({ type: "property", path, value, comparison });
				}}
				onlyShowProperties={isSelect}
			/>
			{!isSelect &&
			typeof comparison === "string" &&
			property &&
			!["isPresent", "isNotPresent"].includes(property) ? (
				<ComparisonSelect
					baseType={item?.type as keyof typeof ZOD_COMPARISONS}
					comparison={comparison}
					setComparison={(value: string | null) => {
						dispatch({ type: "comparison", path, value });
					}}
				/>
			) : null}
			{!isSelect &&
			property &&
			comparison &&
			item?.type !== "ZodBoolean" &&
			item ? (
				<>
					<ValueInput
						item={item}
						path={path}
						value={value}
						dispatch={dispatch}
						queryInput
					/>
					{item.helper && (
						<p className="text-xs text-gray-400">{item.helper}</p>
					)}
					{showDelete ? (
						<RemoveButton onClick={() => dispatch({ type: "remove", path })} />
					) : null}
				</>
			) : null}
			{showDelete && (!comparison || !property) ? (
				<RemoveButton onClick={() => dispatch({ type: "remove", path })} />
			) : null}
		</div>
	);
}

const voices =
	typeof window === "undefined"
		? []
		: window.speechSynthesis
				.getVoices()
				.filter((s) => s.lang === navigator.language)
				.map((s) => s.name);

export function ValueInput({
	value,
	item,
	dispatch,
	path,
	queryInput,
}: {
	value: string | ValueQuery | undefined;
	item: {
		key: string;
		name: string;
		type: any;
		values: any;
		helper?: string;
		inputProps: React.InputHTMLAttributes<HTMLInputElement>;
		isNested: boolean;
	};
	dispatch: React.Dispatch<QueryReducerAction>;

	path: string;
	queryInput?: boolean;
}) {
	const id = useId();
	const noEntityQuery = item.type === "components";
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
							path: queryInput ? path : `${path}.values.${item.key}`,
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

	return !(
		typeof value === "object" &&
		"query" in value &&
		"select" in value
	) ? (
		<div
			className={cn(
				"flex items-end",
				item.isNested ? "value-input-is-nested" : "",
			)}
		>
			<div className="flex-1">
				{queryInput ? null : <label htmlFor={id}>{item.name}</label>}
				<PropertyInput
					id={id}
					inputType={getInputType(item, "=")}
					label={item.name}
					labelHidden
					inputValues={item.values}
					setValue={(value) =>
						dispatch({
							type: "value",
							path: queryInput ? path : `${path}.values.${item.key}`,
							value,
						})
					}
					value={value}
					{...item.inputProps}
				/>
			</div>
			{noEntityQuery ? null : (
				<Tooltip content="Use entity query value">
					<button
						className="btn btn-xs btn-primary btn-outline"
						onClick={() => {
							dispatch({
								type: "value",
								path: queryInput ? path : `${path}.values.${item.key}`,
								value: {
									query: [
										{
											component: "",
											property: "",
											comparison: null,
											value: "",
										},
									],
									select: {
										component: "id" as any,
										property: "",
										matchType: "first",
									},
								},
							});
						}}
					>
						<Icon name="sparkles" />
					</button>
				</Tooltip>
			)}
		</div>
	) : typeof value === "object" ? (
		<div className={item.isNested ? "value-input-is-nested" : ""}>
			<div className="flex gap-2">
				<label htmlFor={id}>{item.name}</label>

				<Tooltip content="Use text value">
					<button
						className="btn btn-xs btn-warning btn-outline"
						onClick={() => {
							dispatch({
								type: "value",
								path: queryInput ? path : `${path}.values.${item.key}`,
								value: "",
							});
						}}
					>
						<Icon name="text-cursor-input" />
					</button>
				</Tooltip>
			</div>
			<div className="w-full">
				<div className="rounded p-2 border border-gray-50/20 w-fit">
					<p>Entity Query</p>
					{value.query.map((q, i) => (
						<QueryComponent
							key={i}
							{...q}
							path={
								queryInput
									? `${path}.value.query.${i}`
									: `${path}.values.${item.key}.query.${i}`
							}
							dispatch={dispatch}
							showDelete={value.query.length > 1}
						/>
					))}
					<button
						className="btn btn-xs btn-primary max-w-fit"
						onClick={() =>
							dispatch({
								type: "add",
								path: queryInput
									? `${path}.value.query`
									: `${path}.values.${item.key}.query`,
							})
						}
					>
						Add Filter
					</button>
					<p className="mt-2">ID/Component Select</p>
					<QueryComponent
						{...value.select}
						path={
							queryInput
								? `${path}.value.select`
								: `${path}.values.${item.key}.select`
						}
						dispatch={dispatch}
						showDelete={false}
					/>
					<Select
						id={id}
						className="max-w-fit"
						size="xs"
						label="Which entities to select?"
						items={matchItems}
						selected={value.select.matchType || null}
						setSelected={(val) => {
							if (!val || Array.isArray(val)) return;
							dispatch({
								type: "matchType",
								path: queryInput
									? `${path}.value.select`
									: `${path}.values.${item.key}.select`,
								value: val as any,
							});
						}}
					/>
				</div>
			</div>
		</div>
	) : null;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
	return (
		<Tooltip content="Remove Filter">
			<button className="btn-outline btn btn-xs btn-error" onClick={onClick}>
				<Icon name="x" />
			</button>
		</Tooltip>
	);
}

function ComparisonSelect({
	baseType,
	comparison,
	setComparison,
}: {
	baseType: keyof typeof ZOD_COMPARISONS | undefined;
	comparison: string | null;
	setComparison: (value: string | null) => void;
}) {
	const comparisons = baseType ? ZOD_COMPARISONS[baseType] : [];
	const items = comparisons.map((c) => ({ id: c, label: c }));
	const id = useId();
	return (
		<Select
			id={id}
			size="xs"
			disabled={!baseType}
			label="Comparison"
			labelHidden
			items={items}
			selected={comparison}
			setSelected={(value) => {
				if (Array.isArray(value)) return;

				setComparison(value ? value : null);
			}}
		/>
	);
}

function ComponentCombobox({
	component,
	onChange,
	isSelect,
}: {
	component: keyof typeof components | "";
	onChange: (value: keyof typeof components | "") => void;
	isSelect?: boolean;
}) {
	return (
		<ComboBox
			aria-label="Component"
			selectedKey={component}
			onSelectionChange={(selection) =>
				onChange(selection as keyof typeof components)
			}
		>
			<div className="cursor-pointer min-h-6 h-6 leading-5 relative border-secondary border rounded-lg">
				<RAInput className="w-full bg-transparent placeholder:text-secondary placeholder:font-semibold text-secondary-content border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5" />
				<Button className="absolute w-10 bg-secondary/20 hover:bg-secondary/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
					<Icon
						name="chevron-down"
						className="w-5 h-5 text-secondary-content"
						aria-hidden="true"
					/>
				</Button>
			</div>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					className="bg-gray-900/90 border-gray-400 border rounded-md shadow-lg max-h-60 w-full overflow-auto text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
					items={[
						isSelect ? { id: "id" } : [],
						...Object.keys(components).map((id) => ({ id })),
					].flat()}
				>
					{(item) => (
						<ListBoxItem className="font-normal truncate cursor-default select-none py-1 px-2 data-[focused]:bg-secondary text-white">
							{capitalCase(item.id)}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}

export function PropertyCombobox({
	component,
	property,
	onChange,
	onlyShowProperties,
}: {
	component: keyof typeof components | "id" | "";
	property: string;
	onChange: (value: string) => void;
	onlyShowProperties?: boolean;
}) {
	if (component === "id") return null;
	const properties = !component
		? []
		: [
				...(onlyShowProperties ? [] : ["isPresent", "isNotPresent"]),
				...parseSchema(schemaWithoutDefault(component)).map((item) =>
					ZOD_COMPARISONS[item.type as keyof typeof ZOD_COMPARISONS]
						? item.key
						: [],
				),
			]
				.flat()
				.map((id) => ({ id }));

	return (
		<ComboBox
			aria-label="Property"
			selectedKey={property}
			onSelectionChange={(selection) => onChange(selection as string)}
		>
			<div className="cursor-pointer min-h-6 h-6 leading-5 relative border-secondary border rounded-lg">
				<RAInput className="w-full bg-transparent placeholder:text-secondary placeholder:font-semibold text-secondary-content border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5" />
				<Button className="absolute w-10 bg-secondary/20 hover:bg-secondary/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
					<Icon
						name="chevron-down"
						className="w-5 h-5 text-secondary-content"
						aria-hidden="true"
					/>
				</Button>
			</div>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					className="bg-gray-900/90 border-gray-400 border rounded-md shadow-lg max-h-60 w-full overflow-auto text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
					items={properties}
				>
					{(item) => (
						<ListBoxItem className="font-normal truncate cursor-default select-none py-1 px-2 data-[focused]:bg-secondary text-white">
							{capitalCase(item.id)}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}

export function PropertyInput({
	inputType,
	inputValues,
	value,
	setValue,
	label,
	labelHidden = true,
	multiple,
	id,
}: {
	inputType: InputTypes;
	inputValues?: string[];
	value?: any;
	setValue: (value: any) => void;
	label: string;
	labelHidden?: boolean;
	multiple?: boolean;
	id: string;
}) {
	switch (inputType) {
		case "number":
			return (
				<Input
					id={id}
					className="input-sm"
					fixed
					label={label}
					labelHidden={labelHidden}
					onChange={(e) => setValue(e.target.value)}
					value={value}
				/>
			);
		case "checkbox":
			return (
				<Checkbox
					id={id}
					label={label}
					labelHidden={labelHidden}
					onChange={(e) => setValue(e.target.checked)}
					checked={value}
				/>
			);
		case "select":
			return (
				<Select
					id={id}
					size="xs"
					label={label}
					labelHidden={labelHidden}
					items={inputValues?.map((i) => ({ id: i, label: i })) || []}
					selected={value}
					setSelected={(newValue) => {
						setValue(newValue);
					}}
					multiple={multiple}
				/>
			);
		case "date":
			return (
				<Input
					id={id}
					fixed
					className="input-sm"
					type="date"
					label={label}
					labelHidden={labelHidden}
					onChange={(e) => setValue(e.target.value)}
					value={value}
				/>
			);
		case "tags":
			return (
				<TagInput
					label={label}
					labelHidden
					tags={value || []}
					onAdd={(t) =>
						setValue(
							[...(value || []), t].filter((a, i, arr) => arr.indexOf(a) === i),
						)
					}
					onRemove={(t) => setValue(value?.filter((v: any) => v !== t) || [])}
				/>
			);
		case "object":
			return <></>;
		case "starmapCoordinates":
			return <StarmapCoordinates value={value} setValue={setValue} />;
		case "shipTemplate":
			return <ShipTemplate value={value} setValue={setValue} />;
		case "components":
			return <ComponentsEditor components={value} setValue={setValue} />;
		case "sound": {
			const sound = value || {
				url: "",
				volume: [1, 1],
				playbackRate: [1, 1],
				loop: false,
				loopStart: null,
				loopEnd: null,
				delay: 0,
				loopGap: 0,
				channel: null,
			};
			return (
				<SoundConfigForm
					sound={sound}
					updateSound={(property, value) =>
						setValue({ ...sound, [property]: value })
					}
				/>
			);
		}
		default:
			if (inputType !== "text") {
				console.warn("Unknown input type", inputType);
			}
			return (
				<Input
					id={id}
					className="input-sm"
					fixed
					label={label}
					labelHidden={labelHidden}
					onBlur={(e) => setValue(e.target.value)}
					defaultValue={value}
				/>
			);
	}
}

function ComponentsEditor({
	components,
	setValue,
}: {
	components: EntityQuery;
	setValue: (value: EntityQuery) => void;
}) {
	return (
		<div>
			{!components || components.length === 0 ? (
				<ComponentCombobox
					component=""
					onChange={(component) =>
						setValue(queryReducer(components || [], { type: "add", component }))
					}
				/>
			) : (
				components?.map(({ component, property, value }, i) => {
					const item = component
						? parseSchema(schemaWithoutDefault(component as ComponentIds)).find(
								(p) => p.key === property,
							)
						: null;
					return (
						<div
							key={`${i}-${component as ComponentIds}`}
							className="flex w-full"
						>
							<ComponentCombobox
								component={component as ComponentIds}
								onChange={(component) =>
									setValue(
										queryReducer(components, {
											type: "component",
											path: i.toString(),
											value: component,
										}),
									)
								}
							/>
							<PropertyCombobox
								onlyShowProperties
								component={component as ComponentIds}
								property={property}
								onChange={(property) =>
									setValue(
										queryReducer(components, {
											type: "property",
											path: i.toString(),
											comparison: "",
											value: property,
										}),
									)
								}
							/>
							{item ? (
								<>
									<ValueInput
										item={item}
										path={i.toString()}
										value={value}
										dispatch={(action) =>
											setValue(queryReducer(components, action))
										}
										queryInput
									/>
									{item.helper && (
										<p className="text-xs text-gray-400">{item.helper}</p>
									)}
									{/* {showDelete ? (
						<RemoveButton onClick={() => dispatch({ type: "remove", path })} />
					) : null} */}
								</>
							) : null}
						</div>
					);
				})
			)}
		</div>
	);
}
