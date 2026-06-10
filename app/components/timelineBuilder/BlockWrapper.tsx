import { useSortableListener } from "@thorium/components/timelineBuilder/SortableListenerContext";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import type { ReactNode } from "react";
import { Button } from "react-aria-components";

export function BlockWrapper({
	children,
	onRemove,
	className,
}: {
	children: ReactNode;
	onRemove: () => void;
	className?: string;
}) {
	const listeners = useSortableListener();
	return (
		<div
			className={cn(
				"border w-fit border-white/10 shadow-[2px_2px_10px_rgba(0,0,0,0.5)] backdrop-brightness-200 rounded",
				className,
			)}
		>
			<div className="group relative flex w-fit flex-col items-start rounded bg-black/80 px-2 py-1 backdrop-blur-md">
				{children}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
					<button
						aria-label="Rearrange"
						{...listeners}
						className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-white/50 bg-black/20 hover:bg-white/20 hover:backdrop-brightness-200 hover:backdrop-saturate-200"
					>
						<Icon name="grip-vertical" size="xs" />
					</button>
				</div>

				<div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 p-3 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
					<Button
						aria-label="Delete block"
						className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-white/50 bg-black/20 hover:bg-white/20 hover:backdrop-brightness-200 hover:backdrop-saturate-200"
						onPress={onRemove}
					>
						<Icon name="x" size="xs" />
					</Button>
				</div>
			</div>
		</div>
	);
}
