import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import React from "react";
import {
	Menu as AriaMenu,
	MenuItem as AriaMenuItem,
	MenuSection as AriaMenuSection,
	MenuTrigger as AriaMenuTrigger,
	SubmenuTrigger as AriaSubmenuTrigger,
	type MenuItemProps,
	type MenuProps,
	type MenuSectionProps,
	type MenuTriggerProps,
	type SubmenuTriggerProps,
	Popover,
	Text,
} from "react-aria-components";

import "./Menu.css";

export function MenuTrigger(props: MenuTriggerProps) {
	const [trigger, menu] = React.Children.toArray(props.children) as [
		React.ReactElement,
		React.ReactElement,
	];
	return (
		<AriaMenuTrigger {...props}>
			{trigger}
			<Popover>{menu}</Popover>
		</AriaMenuTrigger>
	);
}

export function Menu<T extends object>(props: MenuProps<T>) {
	return (
		<AriaMenu
			{...props}
			className={cn(
				"react-aria-Menu bg-black/60 backdrop-blur backdrop-brightness-200 text-white border-white border rounded",
				props.className,
			)}
		>
			{props.children}
		</AriaMenu>
	);
}

export function MenuItem(props: Omit<MenuItemProps, "children"> & { children?: React.ReactNode }) {
	const textValue =
		props.textValue || (typeof props.children === "string" ? props.children : undefined);
	return (
		<AriaMenuItem {...props} textValue={textValue}>
			{({ hasSubmenu, isSelected, selectionMode }) => (
				<>
					{isSelected && selectionMode === "multiple" ? <Icon name="check" /> : null}
					{isSelected && selectionMode === "single" ? <Icon name="circle-dot" /> : null}
					{typeof props.children === "string" ? (
						<Text slot="label">{props.children}</Text>
					) : (
						props.children
					)}
					{hasSubmenu && <Icon name="chevron-right" />}
				</>
			)}
		</AriaMenuItem>
	);
}

export function MenuSection<T extends object>(props: MenuSectionProps<T>) {
	return <AriaMenuSection {...props} />;
}

export function SubmenuTrigger(props: SubmenuTriggerProps) {
	const [trigger, menu] = React.Children.toArray(props.children) as [
		React.ReactElement,
		React.ReactElement,
	];
	return (
		<AriaSubmenuTrigger {...props}>
			{trigger}
			<Popover offset={-2} crossOffset={-4}>
				{menu}
			</Popover>
		</AriaSubmenuTrigger>
	);
}
