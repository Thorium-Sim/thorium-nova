import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { cn } from "@thorium/utils/cn";

const InfoTip = ({
	children,
	className,
	dialogClassName,
}: { children: ReactNode; className?: string; dialogClassName?: string }) => {
	return (
		<DialogTrigger>
			<Button
				className={cn(
					"btn btn-ghost btn-xs p-0 !px-0 !min-h-4 !h-4 w-4",
					className,
				)}
				aria-label="More Info"
			>
				<Icon
					name="info"
					className="inline-block text-primary text-base cursor-pointer"
				/>
			</Button>
			<Popover className={cn("theme-container", popoverTransitionClasses)}>
				<Dialog
					className={cn(
						"max-w-xs w-max panel !bg-black/90 text-white p-2",
						dialogClassName,
					)}
				>
					{children}
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
};
export default InfoTip;
