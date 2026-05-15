import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { cn } from "@thorium/utils/cn";
import type { ReactNode } from "react";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";

import { Icon } from "./Icon";

const InfoTip = ({
	children,
	className,
	dialogClassName,
}: {
	children: ReactNode;
	className?: string;
	dialogClassName?: string;
}) => {
	return (
		<DialogTrigger>
			<Button
				className={cn("btn btn-ghost btn-xs p-0 !px-0 !min-h-4 !h-4 w-4", className)}
				aria-label="More Info"
			>
				<Icon name="info" className="text-primary inline-block cursor-pointer text-base" />
			</Button>
			<Popover className={cn("theme-container", popoverTransitionClasses)}>
				<Dialog className={cn("max-w-xs w-max panel !bg-black/90 text-white p-2", dialogClassName)}>
					{children}
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
};
export default InfoTip;
