import * as Cores from "@thorium/cores";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import { capitalCase } from "change-case";
import { Button, ComboBox, Input, ListBox, ListBoxItem, Popover } from "react-aria-components";

export const coreNames = Object.keys(Cores);

export function AddCoreCombobox({ onChange }: { onChange: (coreName: string | null) => void }) {
	return (
		<ComboBox aria-label="ship" onSelectionChange={(c) => onChange(c as string | null)}>
			<div className="border-info relative h-6 min-h-6 cursor-pointer rounded-lg border leading-5">
				<Input
					placeholder="Add Core"
					className="placeholder:text-info text-info w-full border-none bg-transparent pr-10 pl-3 text-xs leading-5 outline-none placeholder:font-semibold focus:ring-0"
				/>
				<Button className="bg-info/20 hover:bg-info/50 absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded">
					<Icon name="chevrons-up-down" className="text-success h-5 w-5" aria-hidden="true" />
				</Button>
			</div>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					className="max-h-60 w-full overflow-auto rounded-md border border-gray-400 bg-gray-900/90 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
					items={coreNames.map((id) => ({ id }))}
				>
					{(item) => (
						<ListBoxItem className="data-[focused]:bg-info cursor-default truncate px-2 py-1 font-normal text-white select-none">
							{capitalCase(item.id).replace("Core", "").trim()}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}
