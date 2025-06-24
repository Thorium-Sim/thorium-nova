import type { TimelineBlock } from "@thorium/routes/config/timelines/builder/TimelineBlockTypes";
import { components } from "@thorium/ecs-components";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import {
	parseSchema,
	schemaWithoutDefault,
	ZOD_COMPARISONS,
} from "@thorium/utils/zodAutoForm";
import { matchSorter } from "match-sorter";
import { useId, useState, type ComponentProps } from "react";
import {
	type Key,
	ComboBox,
	Group,
	Input as RAInput,
	Button as RAButton,
	Popover,
	ListBox,
	ListBoxItem,
} from "react-aria-components";

export type BlockProps<T extends TimelineBlock["type"]> = Extract<
	TimelineBlock,
	{ type: T }
> & {
	update: <P extends keyof Extract<TimelineBlock, { type: T }>>(
		property: P,
		value: Extract<TimelineBlock, { type: T }>[P],
	) => void;
};

const madLibInput = cn(
	"peer text-blue-300 bg-blue-500/10 h-6 border border-blue-300/70 rounded pl-2 w-min",
	"focus-within:ring focus-within:ring-blue-500 focus-within:bg-blue-500/20 focus-within:outline-none",
);

export function MadLibSelect({
	options,
	value,
	onChange,
}: { options: string[]; value: string; onChange: (value: string) => void }) {
	return (
		<select
			className={madLibInput}
			value={value}
			onChange={(e) => onChange(e.currentTarget.value)}
		>
			{options?.map((o) => (
				<option key={o}>{o}</option>
			))}
		</select>
	);
}
function MadLibDatalist({
	options,
	value,
	onChange,
}: { options: string[]; value: string; onChange: (value: string) => void }) {
	const id = useId();
	return (
		<>
			<input
				className={madLibInput}
				list={id}
				value={value}
				onChange={(e) => onChange(e.currentTarget.value)}
			/>
			<datalist id={id}>
				{options?.map((o) => (
					<option key={o}>{o}</option>
				))}
			</datalist>
		</>
	);
}
export function EntityInput({
	value = "entity 1",
	onChange,
}: { value?: string; onChange: (value: string) => void }) {
	return (
		<span className="relative w-min">
			<input
				value={value}
				size={Math.max(value.length, "Entity".length)}
				onChange={(e) => {
					onChange(e.currentTarget.value);
				}}
				placeholder="Entity"
				className={madLibInput}
			/>
			<div className="peer-focus-within:block hidden pointer-events-none absolute top-full pt-1 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-blue-200">
				{value.toLowerCase() === "this timeline"
					? "The current timeline"
					: value.startsWith("#")
						? "Entity by Tag"
						: value.startsWith("$")
							? "Entity by Local Variable"
							: value.toLowerCase().startsWith("entity") &&
									!Number.isNaN(Number(value.split(" ").at(-1)?.trim()))
								? "Entity by ID"
								: "Entity by Name"}
			</div>
		</span>
	);
}

export function ValueInput(
	props: Omit<ComponentProps<"input">, "value" | "onChange"> & {
		value: string;
		onChange: (value: string) => void;
	},
) {
	const value = props.value || "";
	return (
		<span className="relative w-min">
			<input
				placeholder="Value"
				{...props}
				size={Math.max(value.length + 3, 5)}
				onChange={(e) => {
					props.onChange(e.currentTarget.value);
				}}
				className={cn(madLibInput, props.className)}
			/>
			<div className="peer-focus-within:block hidden pointer-events-none absolute top-full pt-1 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-blue-200">
				{value.startsWith("$") ? "Local Variable" : "Literal Value"}
			</div>
		</span>
	);
}
export function ComponentPropertySelect({
	component,
	setComponent,
	property,
	setProperty,
	comparison,
	setComparison,
	value,
	setValue,
	onlyShowProperties,
}: {
	onlyShowProperties?: boolean;
	component: string;
	property: string;
	comparison?: string;
	value?: string;
	setComponent: (value: string) => void;
	setProperty: (value: string) => void;
	setComparison?: (value: string) => void;
	setValue?: (value: string) => void;
}) {
	const propertyItems = parseSchema(schemaWithoutDefault(component as any));
	const properties = [
		...(onlyShowProperties ? [] : ["isPresent", "isNotPresent"]),
		...propertyItems.flatMap((item) =>
			ZOD_COMPARISONS[item.type as keyof typeof ZOD_COMPARISONS]
				? item.key
				: [],
		),
	];

	const selectedItem = propertyItems.find((p) => p.key === property);
	const comparisonType = selectedItem?.type;

	return (
		<>
			<MadLibsCombobox
				placeholder="Component"
				value={component}
				onChange={setComponent}
				items={Object.keys(components).map((c) => ({ id: c }))}
			/>
			<MadLibsCombobox
				placeholder="Property"
				value={property}
				onChange={setProperty}
				items={properties.map((c) => ({ id: c }))}
			/>
			{onlyShowProperties ||
			!property ||
			property === "isPresent" ||
			property === "isNotPresent" ||
			!setComparison ||
			!setValue ? null : (
				<>
					{comparisonType === "ZodBoolean" ? (
						<MadLibDatalist
							value={comparison!}
							onChange={setComparison}
							options={
								ZOD_COMPARISONS[
									selectedItem?.type as keyof typeof ZOD_COMPARISONS
								]
							}
						/>
					) : (
						<>
							<MadLibSelect
								value={comparison!}
								onChange={setComparison}
								options={
									ZOD_COMPARISONS[
										selectedItem?.type as keyof typeof ZOD_COMPARISONS
									]
								}
							/>
							<ValueInput value={value!} onChange={setValue!} />
						</>
					)}
				</>
			)}
		</>
	);
}
export function MadLibsCombobox<T extends { id: string }>({
	value,
	onChange,
	items,
	placeholder,
	matchKeys = [],
	labelKey = "id",
}: {
	value: Key | null;
	onChange: (value: string) => void;
	items: T[];
	placeholder: string;
	matchKeys?: string[];
	labelKey?: keyof T;
}) {
	const [query, setQuery] = useState("");
	const filteredItems = matchSorter(items, query, {
		keys: ["id", ...matchKeys],
	});
	return (
		<ComboBox
			className="group flex flex-col gap-1"
			inputValue={query}
			onInputChange={setQuery}
			selectedKey={value}
			allowsCustomValue={false}
			onSelectionChange={(key) => {
				onChange(String(key));
				setQuery((key as string) || "");
			}}
			onOpenChange={(open) => {
				setQuery(open ? "" : String(value) || "");
			}}
			aria-label={placeholder}
		>
			<Group className="flex rounded-lg border-blue-300 border transition shadow-md ring-1 min-h-6 h-6 ring-black/10 focus-visible:ring-2 focus-visible:ring-black">
				<RAInput
					placeholder={value?.toString() || placeholder}
					className="flex-1 w-full border-none py-2 px-3 leading-5 placeholder:text-blue-300 placeholder:font-semibold text-blue-300 bg-transparent outline-none focus:ring-0 pl-3 pr-10 text-xs "
				/>
				<RAButton className="px-3 flex items-center text-blue-300 transition border-0 border-solid border-l border-l-blue-300 rounded-r-lg pressed:bg-blue-300/50 bg-blue-300/20 hover:bg-blue-300/50 cursor-pointer">
					<Icon name="chevrons-up-down" />
				</RAButton>
			</Group>
			<Popover className="max-h-60 w-(--trigger-width) overflow-auto rounded-md bg-gray-900/90 border-gray-400 border text-base shadow-lg ring-1 ring-black/5 entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out">
				<ListBox className="outline-hidden p-1" items={filteredItems}>
					{(item) => (
						<ListBoxItem
							textValue={String(item[labelKey])}
							key={item.id}
							className="group flex items-center gap-0.5 cursor-default select-none outline-hidden rounded-sm text-gray-900 focus:bg-sky-600 focus:text-white"
						>
							{({ isSelected, isFocusVisible, isHovered }) => (
								<>
									<span
										className={cn(
											"flex-1 flex items-center gap-1 truncate font-normal group-selected:font-medium text-white py-1 pl-1 pr-2 rounded",
											{
												"text-white bg-blue-500": isFocusVisible,
												"bg-blue-400/40": isHovered,
											},
										)}
									>
										{String(item[labelKey])}
									</span>
									{isSelected && (
										<span className="w-5 flex items-center text-blue-300 group-focus:text-white">
											<Icon name="check" />
										</span>
									)}
								</>
							)}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}
