import { Combobox, Transition } from "@headlessui/react";
import { components } from "@server/components";
import {
	type InputTypes,
	ZOD_COMPARISONS,
	getInputType,
	parseSchema,
} from "@server/utils/zodAutoForm";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { capitalCase } from "change-case";
import { type Dispatch, Fragment, useReducer, useState } from "react";
import { produce } from "immer";
import { Tooltip } from "@thorium/ui/Tooltip";
import type {
	ComponentQuery,
	EntityQuery,
	ValueQuery,
} from "@server/classes/Plugins/Timeline";
import TagInput from "@thorium/ui/TagInput";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@client/utils/cn";
import { useHover, useRole } from "@floating-ui/react";
import { ZoomSliderComp } from "@client/cards/Navigation/MapControls";
import { StarmapCoordinates } from "./StarmapCoordinates";
import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import { q } from "@client/context/AppContext";

type QueryReducerAction =
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

export function queryReducer(
	state: EntityQuery,
	action: QueryReducerAction,
): EntityQuery {
	switch (action.type) {
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

export function EntityQueryBuilder({
	state,
	dispatch,
}: {
	state: EntityQuery;
	dispatch: Dispatch<QueryReducerAction>;
}) {
	return (
		<div className="flex flex-col gap-2">
			{state.map((q, i) => (
				<QueryComponent
					key={i}
					{...q}
					path={i.toString()}
					dispatch={dispatch}
					showDelete={state.length > 1}
				/>
			))}
			<button
				className="btn btn-xs btn-primary max-w-fit"
				onClick={() => dispatch({ type: "add" })}
			>
				Add Query
			</button>
		</div>
	);
}

const matchItems = [
	{ id: "all", label: "All Matches" },
	{ id: "first", label: "First Match" },
	{ id: "random", label: "Random Match" },
];

export function QueryComponent({
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
		? parseSchema(schemaWithoutDefault(component)).find(
				(p) => p.key === property,
		  )
		: null;

	const isSelect = path.endsWith(".select");
	return (
		<div className="flex gap-2 items-end flex-wrap">
			<ComponentCombobox
				component={component}
				onChange={(value) => {
					dispatch({ type: "component", path, value });
				}}
				isSelect={isSelect}
			/>
			<PropertyCombobox
				component={component}
				property={property}
				onChange={(value) => {
					const item = component
						? parseSchema(schemaWithoutDefault(component)).find(
								(p) => p.key === value,
						  )
						: null;
					const comparison =
						ZOD_COMPARISONS[item?.type as keyof typeof ZOD_COMPARISONS]?.[0] ||
						null;

					dispatch({ type: "property", path, value, comparison });
				}}
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
	// Special override for the voice input
	if (item.key.endsWith("voice")) {
		return (
			<div className={item.isNested ? "value-input-is-nested" : ""}>
				<label>{item.name}</label>
				<PropertyInput
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
				{queryInput ? null : <label>{item.name}</label>}
				<PropertyInput
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
									component: "",
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
		</div>
	) : typeof value === "object" ? (
		<div className={item.isNested ? "value-input-is-nested" : ""}>
			<div className="flex gap-2">
				<label>{item.name}</label>

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
					<p className="mt-2">Entity Select</p>
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
	return (
		<Select
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
	const [query, setQuery] = useState("");
	const filteredComponents = [
		isSelect ? "id" : "",
		...Object.keys(components),
	].filter((name) => name?.toLowerCase().includes(query.toLowerCase()));
	return (
		<Combobox
			value={component ? capitalCase(component) : ""}
			onChange={onChange}
		>
			<div className="relative">
				<div className="cursor-pointer min-h-6 h-6 leading-5 relative border-secondary border rounded-lg">
					<Combobox.Input
						placeholder="Component"
						className="w-full bg-transparent placeholder:text-secondary placeholder:font-semibold text-secondary-content border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5"
						onChange={(event) => setQuery(event.target.value)}
					/>
					<Combobox.Button className="absolute w-10 bg-secondary/20 hover:bg-secondary/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
						<Icon
							name="chevrons-up-down"
							className="w-5 h-5 text-secondary-content"
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
						{filteredComponents.length === 0 && query !== "" ? (
							<div className="cursor-default select-none relative py-1 px-1 text-gray-300">
								Nothing found.
							</div>
						) : (
							filteredComponents.map((component) => (
								<Combobox.Option
									key={component}
									className={({ active }) =>
										`cursor-default select-none relative py-1 px-2 ${
											active ? "text-white bg-secondary" : ""
										}`
									}
									value={component}
									title={capitalCase(component)}
								>
									<span className={`block truncate font-normal`}>
										{capitalCase(component)}
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

function PropertyCombobox({
	component,
	property,
	onChange,
}: {
	component: keyof typeof components | "id" | "";
	property: string;
	onChange: (value: string) => void;
}) {
	const [query, setQuery] = useState("");
	if (component === "id") return null;
	const filteredProperties = !component
		? []
		: [
				"isPresent",
				"isNotPresent",
				...parseSchema(schemaWithoutDefault(component)).map((item) =>
					ZOD_COMPARISONS[item.type as keyof typeof ZOD_COMPARISONS]
						? item.key
						: "",
				),
		  ].filter((name) => name?.toLowerCase().includes(query.toLowerCase()));

	return (
		<Combobox value={property} onChange={onChange} disabled={!component}>
			<div className="relative">
				<div className="cursor-pointer min-h-6 h-6 leading-5 relative border-secondary border rounded-lg">
					<Combobox.Input
						placeholder="Property"
						className="w-full bg-transparent placeholder:text-secondary placeholder:font-semibold text-secondary-content border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5"
						onChange={(event) => setQuery(event.target.value)}
					/>
					<Combobox.Button className="absolute w-10 bg-secondary/20 hover:bg-secondary/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
						<Icon
							name="chevrons-up-down"
							className="w-5 h-5 text-secondary-content"
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
						{filteredProperties.length === 0 && query !== "" ? (
							<div className="cursor-default select-none relative py-1 px-1 text-gray-300">
								Nothing found.
							</div>
						) : (
							filteredProperties.map((property) => (
								<Combobox.Option
									key={property}
									className={({ active }) =>
										`cursor-default select-none relative py-1 px-2 ${
											active ? "text-white bg-secondary" : ""
										}`
									}
									value={property}
									title={property}
								>
									<span className={`block truncate font-normal`}>
										{property}
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

function schemaWithoutDefault(component: keyof typeof components) {
	const schema = components[component];
	if (schema && "removeDefault" in schema) return schema.removeDefault();
	return schema;
}

export function PropertyInput({
	inputType,
	inputValues,
	value,
	setValue,
	label,
	labelHidden = true,
	multiple,
}: {
	inputType: InputTypes;
	inputValues?: string[];
	value?: any;
	setValue: (value: any) => void;
	label: string;
	labelHidden?: boolean;
	multiple?: boolean;
}) {
	switch (inputType) {
		case "number":
			return (
				<Input
					className="input-sm"
					fixed
					type="number"
					label={label}
					labelHidden={labelHidden}
					onChange={(e) => setValue(e.target.value)}
					value={value}
				/>
			);
		case "checkbox":
			return (
				<Checkbox
					label={label}
					labelHidden={labelHidden}
					onChange={(e) => setValue(e.target.checked)}
					checked={value}
				/>
			);
		case "select":
			return (
				<Select
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
		default:
			if (inputType !== "text") {
				console.warn("Unknown input type", inputType);
			}
			return (
				<Input
					className="input-sm"
					fixed
					label={label}
					labelHidden={labelHidden}
					onChange={(e) => setValue(e.target.value)}
					value={value}
				/>
			);
	}
}

function ShipTemplate({
	value,
	setValue,
}: {
	value: { pluginId: string; name: string } | undefined;
	setValue: (value: { pluginId: string; name: string } | null) => void;
}) {
	const selectedSpawn = value
		? {
				id: value.name,
				pluginName: value.pluginId,
				name: value.name,
				category: "",
				vanity: "",
		  }
		: null;
	return (
		<SearchableInput<{
			id: string;
			pluginName: string;
			name: string;
			category: string;
			vanity: string;
		}>
			inputClassName="input-sm"
			queryKey="spawn"
			getOptions={async ({ queryKey, signal }) => {
				const result = await q.starmapCore.spawnSearch.netRequest(
					{ query: queryKey[1], allPlugins: true },
					{ signal },
				);
				return result;
			}}
			ResultLabel={({ active, result, selected }) => (
				<DefaultResultLabel active={active} selected={selected}>
					<div className="flex gap-4">
						<img src={result.vanity} alt="" className="w-8 h-8" />
						<div>
							<p className="m-0 leading-none">{result.name}</p>
							<p className="m-0 leading-none">
								<small>{result.category}</small>
							</p>
						</div>
					</div>
				</DefaultResultLabel>
			)}
			setSelected={(item) =>
				setValue(item ? { pluginId: item?.pluginName, name: item?.name } : null)
			}
			selected={selectedSpawn}
			placeholder="Ship Spawn Search..."
		/>
	);
}
