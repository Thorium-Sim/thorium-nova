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
	SubmenuTrigger,
} from "react-aria-components";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import type { ReactNode } from "react";
import { cn } from "@thorium/utils/cn";
import { q } from "@thorium/context/AppContext";
import type { MacroPlugin } from "@thorium/.server/classes/Plugins/Macro";

export function StyledMenuItem(props: MenuItemProps) {
	return (
		<MenuItem
			{...props}
			className={cn(
				"group flex w-full text-sm items-center rounded-md pl-4 px-2 py-1 box-border outline-hidden cursor-default text-gray-200 focus:bg-violet-500 focus:text-white",
				props.className,
			)}
		/>
	);
}

export const popoverClass =
	"p-1 w-64 overflow-auto rounded-md bg-black/60 border-2 border-white/10 shadow-[2px_2px_10px_rgba(0,0,0,0.5)] backdrop-brightness-200 text-white backdrop-blur ring-1 ring-white/5 entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95 fill-mode-forwards origin-top-left";

export function AddBlockButton({
	onAddBlock,
	children,
	omitBlocks,
	executionType,
	macro,
}: {
	onAddBlock: <T extends TimelineBlock["type"]>(
		blockType: T,
		initParams?: Partial<
			Omit<Extract<TimelineBlock, { type: T }>, "id" | "type">
		>,
	) => void;
	children: ReactNode;
	omitBlocks?: boolean;
	macro?: boolean;
	executionType: ("main" | "prerequisite")[];
}) {
	const [macros] = q.plugin.macro.all.useNetRequest({ type: "macro" });

	const groupedMacros = macros.reduce(
		(prev: Record<string, MacroPlugin[]>, next) => {
			if (!prev[next.category]) prev[next.category] = [];
			prev[next.category].push(next);
			return prev;
		},
		{},
	);

	return (
		<MenuTrigger>
			{children}
			<Popover placement="bottom" className={popoverClass}>
				<Menu>
					{executionType.includes("main") ? (
						<>
							<StyledMenuItem onAction={() => onAddBlock("Action")}>
								Action
							</StyledMenuItem>
							<StyledMenuItem
								onAction={() =>
									onAddBlock("Action", { action: "timeline.advance" })
								}
							>
								Advance Timeline
							</StyledMenuItem>
						</>
					) : null}
					{executionType.includes("prerequisite") ? (
						<StyledMenuItem onAction={() => onAddBlock("TimelineAvailability")}>
							Mark Timeline Availability
						</StyledMenuItem>
					) : null}
					<SubmenuTrigger>
						<StyledMenuItem className="flex justify-between">
							Macros <Icon name="chevron-right" />{" "}
						</StyledMenuItem>
						<Popover className={popoverClass}>
							<Menu>
								{Object.entries(groupedMacros).map(([category, macros]) => (
									<SubmenuTrigger key={category}>
										<StyledMenuItem>{category}</StyledMenuItem>
										<Popover className={popoverClass}>
											<Menu>
												{macros.map((m) => (
													<StyledMenuItem
														key={`${m.plugin?.id}-${m.name}`}
														onAction={() => {
															onAddBlock("Macro", {
																pluginId: m.plugin?.id,
																macroId: m.name,
															});
														}}
													>
														{m.name}
													</StyledMenuItem>
												))}
											</Menu>
										</Popover>
									</SubmenuTrigger>
								))}
							</Menu>
						</Popover>
					</SubmenuTrigger>
					{macro && (
						<StyledMenuItem onAction={() => onAddBlock("MacroSlot")}>
							Macro Slot
						</StyledMenuItem>
					)}
					<StyledMenuItem onAction={() => onAddBlock("Note")}>
						Note
					</StyledMenuItem>
					<MenuSection>
						<Header className="font-bold pl-2">Control Flow</Header>

						{executionType.includes("main") ? (
							<StyledMenuItem onAction={() => onAddBlock("Wait")}>
								Wait
							</StyledMenuItem>
						) : null}
						<StyledMenuItem onAction={() => onAddBlock("ForEachEntity")}>
							For Each Entity
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
						<StyledMenuItem onAction={() => onAddBlock("RandomIntoVariable")}>
							Save Random Value as Variable
						</StyledMenuItem>
						<StyledMenuItem onAction={() => onAddBlock("MathIntoVariable")}>
							Save Math Operation as Variable
						</StyledMenuItem>
					</MenuSection>
					{omitBlocks ? (
						<MenuSection>
							<StyledMenuItem onAction={() => onAddBlock("IfCondition")}>
								If Condition
							</StyledMenuItem>
						</MenuSection>
					) : (
						<MenuSection>
							<Header className="font-bold pl-2">Checks</Header>
							<StyledMenuItem onAction={() => onAddBlock("DistanceCondition")}>
								Distance Condition
							</StyledMenuItem>
							<StyledMenuItem onAction={() => onAddBlock("EntityCondition")}>
								Entity Condition
							</StyledMenuItem>
							{executionType.includes("main") ? (
								<StyledMenuItem onAction={() => onAddBlock("EventCondition")}>
									Event Condition
								</StyledMenuItem>
							) : null}
							<StyledMenuItem onAction={() => onAddBlock("IfCondition")}>
								If Condition
							</StyledMenuItem>
						</MenuSection>
					)}
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}
export function AddBlockMenu({
	onAddBlock,
	macro,
	executionType,
}: {
	onAddBlock: <T extends TimelineBlock["type"]>(
		blockType: T,
		initParams?: Partial<
			Omit<Extract<TimelineBlock, { type: T }>, "id" | "type">
		>,
	) => void;
	macro?: boolean;
	executionType: ("main" | "prerequisite")[];
}) {
	return (
		<div className="absolute p-2 bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
			<AddBlockButton
				onAddBlock={onAddBlock}
				macro={macro}
				executionType={executionType}
			>
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
