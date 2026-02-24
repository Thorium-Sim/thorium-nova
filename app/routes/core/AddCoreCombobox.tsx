import * as Cores from "@thorium/cores";
import { capitalCase } from "change-case";
import { Icon } from "@thorium/ui/Icon";
import {
	Button,
	ComboBox,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";

export const coreNames = Object.keys(Cores);

export function AddCoreCombobox({
	onChange,
}: {
	onChange: (coreName: string | null) => void;
}) {
	return (
		<ComboBox
			aria-label="ship"
			onSelectionChange={(c) => onChange(c as string | null)}
		>
			<div className="cursor-pointer min-h-6 h-6 leading-5 relative border-info border rounded-lg">
				<Input
					placeholder="Add Core"
					className="w-full bg-transparent placeholder:text-info placeholder:font-semibold text-info border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5"
				/>
				<Button className="absolute w-10 bg-info/20 hover:bg-info/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
					<Icon
						name="chevrons-up-down"
						className="w-5 h-5 text-success"
						aria-hidden="true"
					/>
				</Button>
			</div>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					className="w-full overflow-auto text-base bg-gray-900/90 border-gray-400 border rounded-md shadow-lg max-h-60 ring-1 ring-black/5 focus:outline-none sm:text-sm"
					items={coreNames.map((id) => ({ id }))}
				>
					{(item) => (
						<ListBoxItem className="font-normal truncate cursor-default select-none py-1 px-2 data-[focused]:bg-info text-white">
							{capitalCase(item.id).replace("Core", "").trim()}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}
