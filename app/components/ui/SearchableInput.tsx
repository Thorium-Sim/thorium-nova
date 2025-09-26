import { Fragment, type ReactElement, type ReactNode, useState } from "react";
import { type QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "./LoadingSpinner";
import { Icon } from "./Icon";
import {
	Button,
	Collection,
	ComboBox,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { useAsyncList } from "react-stately";

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
			<span
				className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
			>
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
	}) => Promise<T[]>;
	selected?: T | null;
	setSelected?: (item: T | null) => void;
	placeholder?: string;
	inputClassName?: string;
}) {
	const list = useAsyncList<T>({
		async load({ signal, cursor, filterText = "" }) {
			const result = await getOptions({
				signal,
				queryKey: ["queryKey", filterText],
			});
			return {
				items: result,
			};
		},
	});

	return (
		<ComboBox
			inputValue={list.filterText}
			onInputChange={list.setFilterText}
			selectedKey={selected?.id}
			onSelectionChange={(key) => {
				const item = list.items.find((d) => d.id === key) || null;
				setSelected?.(item);
				list.setFilterText(displayValue(item as T));
			}}
			menuTrigger="focus"
		>
			<div className="relative mt-1">
				<div className="relative w-full cursor-default overflow-hidden rounded-lg text-left focus:outline-none sm:text-sm">
					<Input
						aria-label="Search"
						className={`input w-full pointer-events-auto ${
							inputClassName || ""
						}`}
						placeholder={placeholder}
					/>
					<Button className="absolute pointer-events-auto inset-y-0 right-0 flex items-center pr-2">
						<Icon
							name="chevrons-up-down"
							className="h-5 w-5 text-gray-400"
							aria-hidden="true"
						/>
					</Button>
				</div>
				<Popover className={popoverTransitionClasses}>
					<ListBox
						items={list.items}
						className=" mt-1 max-h-60 w-full overflow-auto panel !bg-black/90"
						renderEmptyState={() => (
							<div className="my-item">No results found</div>
						)}
					>
						{(item) => (
							<ListBoxItem
								id={item.id}
								className={({ isFocused }) =>
									`relative cursor-default select-none py-2 pl-2 pr-4 ${
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
