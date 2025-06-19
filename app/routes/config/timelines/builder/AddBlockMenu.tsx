import { Icon } from "@thorium/ui/Icon";
import {
	Popover,
	Button,
	MenuTrigger,
	Menu,
	MenuSection,
	Header,
	type MenuItemProps,
	MenuItem,
} from "react-aria-components";
import type { TimelineBlock } from "@thorium/.server/classes/Plugins/TimelineBlockTypes";
import type { ReactNode } from "react";

function StyledMenuItem(props: MenuItemProps) {
	return (
		<MenuItem
			{...props}
			className="group flex w-full text-sm items-center rounded-md pl-4 px-2 py-1 box-border outline-hidden cursor-default text-gray-200 focus:bg-violet-500 focus:text-white"
		/>
	);
}

export function AddBlockButton({
	onAddBlock,
	children,
}: {
	onAddBlock: (blockType: TimelineBlock["type"]) => void;
	children: ReactNode;
}) {
	return (
		<MenuTrigger>
			{children}
			<Popover
				placement="bottom"
				className="p-1 w-64 overflow-auto rounded-md bg-black/60 text-white backdrop-blur shadow-lg ring-1 ring-black/5 entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95 fill-mode-forwards origin-top-left"
			>
				<Menu>
					<StyledMenuItem onAction={() => onAddBlock("Action")}>
						Action
					</StyledMenuItem>
					<MenuSection>
						<Header className="font-bold pl-2">Control Flow</Header>
						<StyledMenuItem onAction={() => onAddBlock("Wait")}>
							Wait
						</StyledMenuItem>
						<StyledMenuItem
							onAction={() => onAddBlock("ResultPropertyIntoVariable")}
						>
							Save Property from Result as Variable
						</StyledMenuItem>
						<StyledMenuItem
							onAction={() => onAddBlock("EntityPropertyIntoVariable")}
						>
							Save Property from Entity as Variable
						</StyledMenuItem>
						<StyledMenuItem onAction={() => onAddBlock("ShipSystemGetter")}>
							Save Ship System from Entity as Variable
						</StyledMenuItem>
						<StyledMenuItem onAction={() => onAddBlock("VariableIntoVariable")}>
							Save Variable from Entity as Variable
						</StyledMenuItem>
						<StyledMenuItem onAction={() => onAddBlock("SetVariable")}>
							Set Entity Variable
						</StyledMenuItem>
					</MenuSection>
					<MenuSection>
						<Header className="font-bold pl-2">Checks</Header>
						<StyledMenuItem onAction={() => onAddBlock("DistanceCondition")}>
							Distance Condition
						</StyledMenuItem>
						<StyledMenuItem onAction={() => onAddBlock("EntityCondition")}>
							Entity Condition
						</StyledMenuItem>
						<StyledMenuItem onAction={() => onAddBlock("EventCondition")}>
							Event Condition
						</StyledMenuItem>
						<StyledMenuItem onAction={() => onAddBlock("IfCondition")}>
							If Condition
						</StyledMenuItem>
					</MenuSection>
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}
export function AddBlockMenu({
	onAddBlock,
}: {
	onAddBlock: (blockType: TimelineBlock["type"]) => void;
}) {
	return (
		<div className="group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 absolute p-2 bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
			<AddBlockButton onAddBlock={onAddBlock}>
				<Button
					aria-label="Add block"
					className="flex rounded-full w-6 h-6 cursor-pointer bg-black/20 hover:bg-white/20 hover:backdrop-brightness-200 hover:backdrop-saturate-200 border border-white/50  items-center justify-center"
				>
					<Icon name="plus" />
				</Button>
			</AddBlockButton>
		</div>
	);
}
