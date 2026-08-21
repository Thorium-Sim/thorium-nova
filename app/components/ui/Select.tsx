import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { cn } from "@thorium/utils/cn";
import {
	Button,
	Header,
	Label,
	type LabelProps,
	ListBox,
	ListBoxItem,
	ListBoxSection,
	Popover,
	Select as RASelect,
	SelectValue,
} from "react-aria-components";

import { Icon } from "./Icon";

export type TSelectItem<I extends string | number> =
	| { id: I; label: string }
	| { header: string; items: TSelectItem<I>[] };
export default function Select<I extends string | number>({
	label,
	labelHidden,
	disabled,
	items,
	selected,
	setSelected,
	size = "md",
	className,
	placeholder,
	multiple,
	id,
	labelProps,
	hideIcon,
	buttonClassName,
}: {
	label: string;
	labelHidden?: boolean;
	disabled?: boolean;
	items: TSelectItem<I>[];
	selected: I | null;
	setSelected: (value: I | null) => void;
	size?: "xxs" | "xs" | "sm" | "md";
	className?: string;
	buttonClassName?: string;
	labelProps?: LabelProps;
	placeholder?: string;
	multiple?: boolean;
	id?: string;
	hideIcon?: boolean;
}) {
	return (
		<RASelect
			isDisabled={disabled}
			id={id}
			placeholder={placeholder}
			selectedKey={selected}
			onSelectionChange={(selected) => setSelected(selected as I)}
			className={`select ${className}`}
		>
			<Label
				className={cn(
					"select-label block text-sm font-medium text-gray-200",
					labelHidden ? "sr-only" : "",

					labelProps?.className,
				)}
			>
				{label}
			</Label>
			<Button
				className={cn(
					"py-2 px-2 flex justify-between items-center select-button bg-gray-900 text-gray-100 relative w-full border border-gray-700 rounded-md shadow-xs text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
					{
						"select-xxs h-5 min-h-5 py-0": size === "xxs",
						"select-xs py-0": size === "xs",
						"select-sm py-1": size === "sm",
					},
					buttonClassName || "",
				)}
			>
				<SelectValue />
				{hideIcon ? null : (
					<Icon name="chevrons-up-down" className="h-5 w-5 text-gray-400" aria-hidden="true" />
				)}
			</Button>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					selectionMode={multiple ? "multiple" : "single"}
					className="select-options ring-opacity-5 data-[focused]:ring-opacity-50 isolate max-h-96 w-fit min-w-32 overflow-y-auto rounded-md bg-gray-900 px-2 py-1 text-sm text-white shadow-lg ring-2 ring-gray-400 outline-none"
				>
					{items.map((item) => (
						<RenderSelectItem {...item} key={"header" in item ? item.header : item.id} />
					))}
				</ListBox>
			</Popover>
		</RASelect>
	);
}

function RenderSelectItem<I extends string | number>(item: TSelectItem<I>) {
	if ("header" in item) {
		return (
			<ListBoxSection key={item.header} className="px-2">
				<Header className="-mx-2 font-bold">{item.header}</Header>
				{item.items.map((item) => (
					<RenderSelectItem {...item} key={"header" in item ? item.header : item.id} />
				))}
			</ListBoxSection>
		);
	}
	return <SelectItem {...item} key={item.id} />;
}

export function SelectItem<I extends string | number>(item: { id: I; label: string }) {
	return (
		<ListBoxItem
			key={item.id}
			id={item.id}
			className="flex min-w-fit cursor-default justify-between rounded py-0.5 text-gray-100 outline-none data-[focused]:bg-blue-600 data-[focused]:text-white"
			textValue={item.label}
		>
			{({ isSelected }) => (
				<>
					{item.label}
					{isSelected ? <Icon name="check" className="h-5 w-5" aria-hidden="true" /> : null}
				</>
			)}
		</ListBoxItem>
	);
}
