import { Fragment, type ReactNode } from "react";

import { Icon } from "./Icon";
import {
	Button,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
	type MenuItemProps,
} from "react-aria-components";
import { cn } from "@thorium/utils/cn";

type Origins =
	| "left"
	| "right"
	| "top"
	| "bottom"
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right"
	| "center";
type TriggerProps =
	| { triggerLabel: string; triggerEl?: null }
	| { triggerLabel?: null; triggerEl: ReactNode };

type DropdownProps = TriggerProps & {
	origin?: `origin-${Origins}`;
	children: ReactNode;
};
export default function Dropdown({
	triggerLabel,
	triggerEl,
	children,
}: DropdownProps) {
	return (
		<MenuTrigger>
			{triggerEl || (
				<Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
					{triggerLabel}
					<Icon
						name="chevron-down"
						className="-mr-1 ml-2 h-5 w-5"
						aria-hidden="true"
					/>
				</Button>
			)}
			<Popover className={popoverTransitionClasses}>
				<Menu className="mt-2 w-56 text-base bg-gray-900/90 text-white border-gray-400 border rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm overflow-y-auto overflow-x-hidden">
					{children}
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}

export const DropdownItem = ({
	activeClass = "bg-gray-100 text-gray-900",
	inactiveClass = "text-gray-100",
	className,
	...props
}: { activeClass?: string; inactiveClass?: string } & MenuItemProps) => {
	return (
		<MenuItem
			className={({ isFocused }) =>
				cn(
					"block px-4 py-2 text-sm w-full text-left",
					isFocused ? activeClass : inactiveClass,
					className,
				)
			}
			{...props}
		/>
	);
};

export const popoverTransitionClasses =
	"transition-all duration-200 origin-[var(--trigger-anchor-point)] data-[entering]:opacity-0 data-[entering]:scale-90 data-[exiting]:opacity-0 data-[exiting]:scale-90";
