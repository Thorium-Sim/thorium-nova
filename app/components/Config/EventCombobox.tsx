import { q } from "@thorium/context/AppContext";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { matchSorter } from "match-sorter";
import { useState } from "react";
import {
	Button,
	ComboBox,
	Group,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";

export function EventCombobox({
	value,
	onChange,
	placeholder = "Events",
}: {
	value: {
		name: string;
		event: string;
		input?: any;
	} | null;
	onChange: (value: { name: string; event: string; input?: any }) => void;
	placeholder?: string;
	className?: string;
}) {
	const [availableEvents] = q.thorium.events.useNetRequest();
	const [query, setQuery] = useState(value?.event || "");
	const filteredEvents = matchSorter(availableEvents, query, {
		keys: ["name", "event"],
	}).map((a) => ({ ...a, key: a.event }));

	return (
		<ComboBox
			className="group flex flex-col gap-1"
			inputValue={query}
			onInputChange={setQuery}
			selectedKey={value?.event}
			allowsCustomValue={false}
			onSelectionChange={(key) => {
				const event = availableEvents.find((a) => a.event === key)!;
				if (!event) return;
				onChange(event);
				setQuery(event.name);
			}}
			onOpenChange={(open) => {
				setQuery(open ? "" : value?.name || "");
			}}
			aria-label={placeholder}
		>
			<Group className="flex h-6 min-h-6 rounded-lg border border-teal-300 shadow-md ring-1 ring-black/10 transition focus-visible:ring-2 focus-visible:ring-black">
				<Input
					placeholder={placeholder}
					className="w-full flex-1 border-none bg-transparent px-3 py-2 pr-10 pl-3 text-xs leading-5 text-teal-300 outline-none placeholder:font-semibold placeholder:text-teal-300 focus:ring-0"
				/>
				<Button className="pressed:bg-teal-300/50 flex cursor-pointer items-center rounded-r-lg border-0 border-l border-solid border-l-teal-300 bg-teal-300/20 px-3 text-teal-300 transition hover:bg-teal-300/50">
					<Icon name="chevrons-up-down" />
				</Button>
			</Group>
			<Popover className="entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out max-h-60 w-(--trigger-width) overflow-auto rounded-md border border-gray-400 bg-gray-900/90 text-base shadow-lg ring-1 ring-black/5">
				<ListBox className="p-1 outline-hidden" items={filteredEvents}>
					{(item) => (
						<ListBoxItem
							textValue={item.name}
							key={item.key}
							className="group flex cursor-default items-center gap-0.5 rounded-sm text-gray-900 outline-hidden select-none focus:bg-sky-600 focus:text-white"
						>
							{({ isSelected, isFocusVisible, isHovered }) => (
								<>
									<span
										className={cn(
											"flex-1 flex items-center gap-1 truncate font-normal group-selected:font-medium text-white py-1 pl-1 pr-2 rounded",
											{
												"text-white bg-teal-300": isFocusVisible,
												"bg-teal-400/40": isHovered,
											},
										)}
									>
										{item.name}
									</span>
									{isSelected && (
										<span className="flex w-5 items-center text-teal-300 group-focus:text-white">
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
