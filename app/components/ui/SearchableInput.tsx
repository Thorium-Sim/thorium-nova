import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { type ReactElement, type ReactNode, useEffect } from "react";
import { Button, ComboBox, Input, ListBox, ListBoxItem, Popover } from "react-aria-components";
import { useAsyncList } from "react-stately";

import { Icon } from "./Icon";

export function DefaultResultLabel({
	children,
	selected,
	active,
}: {
	children: ReactNode;
	selected: boolean;
	active: boolean;
}) {
	return (
		<>
			<span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
				{children}
			</span>
			{selected ? (
				<span
					className={`absolute inset-y-0 right-0 flex items-center pl-3 ${
						active ? "text-white" : "text-teal-600"
					}`}
				>
					<Icon name="check" className="h-5 w-5" aria-hidden="true" />
				</span>
			) : null}
		</>
	);
}

export default function SearchableInput<T extends { id: any }>({
	getOptions,
	ResultLabel,
	displayValue = (item) => item?.id,
	queryKey = "searchableInput",
	selected,
	setSelected,
	placeholder,
	inputClassName,
	className,
	label = "Search",
}: {
	queryKey?: string;
	displayValue?: (item: T) => string;
	ResultLabel: (props: {
		result: T;
		selected: boolean;
		disabled: boolean;
		active: boolean;
	}) => ReactElement;
	getOptions: (queryOptions: {
		queryKey: [string, string];
		signal?: AbortSignal;
	}) => T[] | Promise<T[]>;
	selected?: T | null;
	setSelected?: (item: T | null) => void;
	placeholder?: string;
	inputClassName?: string;
	className?: string;
	label?: string;
}) {
	const list = useAsyncList<T>({
		async load({ signal, filterText = "" }) {
			const result = await getOptions({
				signal,
				queryKey: [queryKey, filterText],
			});
			return {
				items: result,
			};
		},
	});

	useEffect(() => {
		if (selected === null && list.filterText) {
			list.setFilterText("");
		}
	}, [selected, list.filterText, list.setFilterText]);
	return (
		<ComboBox
			inputValue={list.filterText}
			onInputChange={list.setFilterText}
			selectedKey={selected === null ? null : selected?.id}
			onSelectionChange={(key) => {
				const item = list.items.find((d) => d.id === key) || null;
				setSelected?.(item);
				list.setFilterText(displayValue(item as T));
			}}
			menuTrigger="focus"
			className={className}
			aria-label={label}
		>
			<div className="relative mt-1">
				<div className="relative w-full cursor-default overflow-hidden rounded-lg text-left focus:outline-none sm:text-sm">
					<Input
						aria-label="Search"
						className={`input pointer-events-auto w-full ${inputClassName || ""}`}
						placeholder={placeholder}
					/>
					<Button className="pointer-events-auto absolute inset-y-0 right-0 flex items-center pr-2">
						<Icon name="chevrons-up-down" className="h-5 w-5 text-gray-400" aria-hidden="true" />
					</Button>
				</div>
				<Popover className={popoverTransitionClasses}>
					<ListBox
						items={list.items}
						className="panel mt-1 max-h-60 w-[--trigger-width] overflow-auto !bg-black/90"
						renderEmptyState={() => <div className="my-item">No results found</div>}
					>
						{(item) => (
							<ListBoxItem
								id={item.id}
								className={({ isFocused }) =>
									`relative cursor-default py-2 pr-4 pl-2 select-none ${
										isFocused ? "bg-primary text-white" : "text-gray-200"
									}`
								}
								textValue={displayValue(item)}
							>
								{({ isSelected, isFocused, isDisabled }) => (
									<ResultLabel
										result={item}
										active={isFocused}
										disabled={isDisabled}
										selected={isSelected}
									/>
								)}
							</ListBoxItem>
						)}
					</ListBox>
				</Popover>
			</div>
		</ComboBox>
	);
}
