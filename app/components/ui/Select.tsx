import { Icon } from "./Icon";
import { cn } from "@thorium/utils/cn";
import {
	Button,
	type Key,
	Label,
	type LabelProps,
	ListBox,
	ListBoxItem,
	Popover,
	Select as RASelect,
	SelectValue,
} from "react-aria-components";
function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

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
}: {
	label: string;
	labelHidden?: boolean;
	disabled?: boolean;
	items: { id: I; label: string }[];
	selected: Key | null;
	setSelected: (value: Key | null) => void;
	size?: "xxs" | "xs" | "sm" | "md";
	className?: string;
	labelProps?: LabelProps;
	placeholder?: string;
	multiple?: boolean;
	id?: string;
}) {
	return (
		<RASelect
			isDisabled={disabled}
			id={id}
			placeholder={placeholder}
			selectedKey={selected}
			onSelectionChange={(selected) => setSelected(selected)}
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
					"py-2 px-2 flex justify-between items-center select-button bg-gray-900 text-gray-100 relative w-full border border-gray-700 rounded-md shadow-sm text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
					{
						"select-xxs h-5 min-h-5 py-0": size === "xxs",
						"select-xs py-0": size === "xs",
						"select-sm py-1": size === "sm",
					},
					className || "",
				)}
			>
				<SelectValue />
				<Icon
					name="chevrons-up-down"
					className="h-5 w-5 text-gray-400"
					aria-hidden="true"
				/>
			</Button>
			<Popover>
				<ListBox
					selectionMode={multiple ? "multiple" : "single"}
					className="select-options isolate min-w-fit bg-gray-900 shadow-lg rounded-md py-1 px-0.5 text-sm ring-2 ring-gray-400 ring-opacity-5 text-white max-h-96 overflow-y-auto outline-none data-[focused]:ring-opacity-50"
				>
					{items.map((item) => (
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
					))}
				</ListBox>
			</Popover>
		</RASelect>
	);
	// return (
	// 	<Listbox
	// 		value={selected as I | I[] | undefined}
	// 		onChange={setSelected}
	// 		disabled={disabled}
	// 		multiple={multiple}
	// 	>
	// 		{({ open }) => (
	// 			<>
	// 				<Listbox.Label
	// 					{...labelProps}
	// 					className={cn(
	// 						"select-label block text-sm font-medium text-gray-200",
	// 						labelHidden ? "sr-only" : "",
	// 						typeof labelProps?.className === "function"
	// 							? labelProps.className({})
	// 							: labelProps?.className || "",
	// 					)}
	// 				>
	// 					{label}
	// 				</Listbox.Label>
	// 				<div
	// 					className={classNames(
	// 						labelHidden ? "" : "mt-1",
	// 						"relative leading-none",
	// 					)}
	// 					id={`${id}-toggle`}
	// 				>
	// 					<Listbox.Button
	// 						className={classNames(
	// 							size === "xxs"
	// 								? "select-xxs h-5 min-h-5 py-0"
	// 								: size === "xs"
	// 									? "select-xs py-0"
	// 									: size === "sm"
	// 										? "select-sm py-1"
	// 										: "py-2",
	// 							"select-button bg-gray-900 text-gray-100 relative w-full border border-gray-700 rounded-md shadow-sm pl-3 pr-10 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
	// 							className || "",
	// 						)}
	// 					>
	// 						<span className="block truncate">
	// 							{selectedItem.length >= 3
	// 								? `${selectedItem.length} Selected`
	// 								: selectedItem.length > 0
	// 									? selectedItem.map((i) => i.label).join(" | ")
	// 									: placeholder
	// 										? placeholder
	// 										: multiple
	// 											? "Choose One or More"
	// 											: "Choose One"}
	// 						</span>
	// 						<span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
	// 							<Icon
	// 								name="chevrons-up-down"
	// 								className="h-5 w-5 text-gray-400"
	// 								aria-hidden="true"
	// 							/>
	// 						</span>
	// 					</Listbox.Button>
	// 					<Portal>
	// 						{/* @ts-expect-error */}
	// 						<div anchor={`${id}-toggle`}>
	// 							<Transition show={open}>
	// 								<Listbox.Options className="select-options ease-in duration-100 opacity-100 data-[closed]:opacity-0 isolate min-w-fit absolute z-10 mt-1 w-full bg-gray-900 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-gray-400 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
	// 									{items.map((item) => (
	// 										<Listbox.Option
	// 											key={item.id}
	// 											className={({ active }) =>
	// 												classNames(
	// 													active ? "text-white bg-blue-600" : "text-gray-100",
	// 													"cursor-default select-none relative py-2 pl-3 pr-9 min-w-fit",
	// 												)
	// 											}
	// 											value={item.id}
	// 											title={item.label}
	// 										>
	// 											{({ selected, active }) => (
	// 												<>
	// 													<span
	// 														className={classNames(
	// 															selected ? "font-semibold" : "font-normal",
	// 															"block truncate",
	// 														)}
	// 													>
	// 														{item.label}
	// 													</span>

	// 													{selected ? (
	// 														<span
	// 															className={classNames(
	// 																active ? "text-white" : "text-blue-600",
	// 																"absolute inset-y-0 right-0 flex items-center pr-4",
	// 															)}
	// 														>
	// 															<Icon
	// 																name="check"
	// 																className="h-5 w-5"
	// 																aria-hidden="true"
	// 															/>
	// 														</span>
	// 													) : null}
	// 												</>
	// 											)}
	// 										</Listbox.Option>
	// 									))}
	// 								</Listbox.Options>
	// 							</Transition>
	// 						</div>
	// 					</Portal>
	// 				</div>
	// 			</>
	// 		)}
	// 	</Listbox>
	// );
}
