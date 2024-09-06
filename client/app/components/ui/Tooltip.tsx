import { cn } from "@client/utils/cn";
import {
	flip,
	offset,
	shift,
	useFloating,
	useInteractions,
	useHover,
	useRole,
	type Placement,
} from "@floating-ui/react";
import { Portal } from "@headlessui/react";
import { forwardRef, type ReactNode, useState } from "react";

export const Tooltip = forwardRef<
	HTMLDivElement,
	{
		content: ReactNode;
		children: ReactNode;
		placement?: Placement;
		className?: string;
		tooltipClassName?: string;
	}
>(
	(
		{ content, children, placement = "top", tooltipClassName, ...props },
		ref,
	) => {
		const [open, setOpen] = useState(false);

		const { x, y, refs, strategy, context } = useFloating({
			placement,
			middleware: [offset(), flip(), shift()],
			open,
			onOpenChange: setOpen,
		});

		const { getReferenceProps, getFloatingProps } = useInteractions([
			useHover(context),
			useRole(context, { role: "tooltip" }),
		]);
		return (
			<>
				<div ref={refs.setReference} {...props} {...getReferenceProps()}>
					{children}
				</div>
				{open && (
					<Portal>
						<div
							ref={(el) => {
								refs.setFloating(el);
								if (ref) {
									if (typeof ref === "function") {
										ref(el);
									} else {
										ref.current = el;
									}
								}
							}}
							style={{
								position: strategy,
								top: y ?? 0,
								left: x ?? 0,
							}}
							className={cn(
								"text-white border-white/50 border bg-black/90 py-1 px-2 rounded drop-shadow-xl z-50",
								tooltipClassName,
							)}
							{...getFloatingProps()}
						>
							{content}
						</div>
					</Portal>
				)}
			</>
		);
	},
);

Tooltip.displayName = "Tooltip";
