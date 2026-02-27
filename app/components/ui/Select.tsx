import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Icon } from "./Icon";
import { cn } from "@thorium/utils/cn";
import {
	Button,
	Header,
	type Key,
	Label,
	type LabelProps,
	ListBox,
	ListBoxItem,
	ListBoxSection,
	Popover,
	Select as RASelect,
	SelectValue,
} from "react-aria-components";

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
	items: (
		| { id: I; label: string }
		| { header: string; items: { id: I; label: string }[] }
	)[];
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
			className={className}
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
					"py-2 px-2 flex justify-around items-center select-button bg-gray-900 text-gray-100 relative w-full border border-gray-700 rounded-md shadow-xs text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
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
					<Icon
						name="chevrons-up-down"
						className="h-5 w-5 text-gray-400"
						aria-hidden="true"
					/>
				)}
			</Button>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					selectionMode={multiple ? "multiple" : "single"}
					className="select-options isolate w-fit min-w-32 bg-gray-900 shadow-lg rounded-md py-1 px-2 text-sm ring-2 ring-gray-400 ring-opacity-5 text-white max-h-96 overflow-y-auto outline-none data-[focused]:ring-opacity-50"
				>
					{items.map((item) =>
						"header" in item ? (
							<ListBoxSection key={item.header}>
								<Header className="font-bold">{item.header}</Header>
								{item.items.map((item) => (
									<SelectItem {...item} key={item.id} />
								))}
							</ListBoxSection>
						) : (
							<SelectItem {...item} key={item.id} />
						),
					)}
				</ListBox>
			</Popover>
		</RASelect>
	);
}

function SelectItem<I extends string | number>(item: { id: I; label: string }) {
	return (
		<ListBoxItem
			key={item.id}
			id={item.id}
			className="flex justify-between cursor-default py-0.5 px-2 min-w-fit data-[focused]:text-white data-[focused]:bg-blue-600 text-gray-100 outline-none rounded"
		>
			{({ isSelected }) => (
				<>
					{item.label}
					{isSelected ? (
						<Icon name="check" className="h-5 w-5" aria-hidden="true" />
					) : null}
				</>
			)}
		</ListBoxItem>
	);
}
