import { q } from "@thorium/context/AppContext";
import { useState } from "react";
import { matchSorter } from "match-sorter";
import { cn } from "@thorium/utils/cn";
import { Icon } from "@thorium/ui/Icon";
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
	className,
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
			<Group className="flex rounded-lg border-teal-300 border transition shadow-md ring-1 min-h-6 h-6 ring-black/10 focus-visible:ring-2 focus-visible:ring-black">
				<Input
					placeholder={placeholder}
					className="flex-1 w-full border-none py-2 px-3 leading-5 placeholder:text-teal-300 placeholder:font-semibold text-teal-300 bg-transparent outline-none focus:ring-0 pl-3 pr-10 text-xs "
				/>
				<Button className="px-3 flex items-center text-teal-300 transition border-0 border-solid border-l border-l-teal-300 rounded-r-lg pressed:bg-teal-300/50 bg-teal-300/20 hover:bg-teal-300/50 cursor-pointer">
					<Icon name="chevrons-up-down" />
				</Button>
			</Group>
			<Popover className="max-h-60 w-(--trigger-width) overflow-auto rounded-md bg-gray-900/90 border-gray-400 border text-base shadow-lg ring-1 ring-black/5 entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out">
				<ListBox className="outline-hidden p-1" items={filteredEvents}>
					{(item) => (
						<ListBoxItem
							textValue={item.name}
							key={item.key}
							className="group flex items-center gap-0.5 cursor-default select-none outline-hidden rounded-sm text-gray-900 focus:bg-sky-600 focus:text-white"
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
										<span className="w-5 flex items-center text-teal-300 group-focus:text-white">
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
