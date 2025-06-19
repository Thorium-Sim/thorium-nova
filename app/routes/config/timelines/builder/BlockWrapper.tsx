import { Icon } from "@thorium/ui/Icon";
import type { ReactNode } from "react";
import { Button } from "react-aria-components";

export function BlockWrapper({
	children,
	onRemove,
}: { children: ReactNode; onRemove: () => void }) {
	return (
		<div className="border w-fit border-transparent shadow-[2px_2px_10px_rgba(0,0,0,0.5)] backdrop-brightness-200 rounded">
			<div className="bg-black/80 backdrop-blur-md p-4 rounded flex flex-col items-start relative group w-fit">
				{children}
				<div className="group-hover:opacity-100 group-focus-within:opacity-100 opacity-0 absolute p-3 top-0 right-0 translate-x-1/2 -translate-y-1/2 ">
					<Button
						aria-label="Delete block"
						className="flex rounded-full w-4 h-4 cursor-pointer bg-black/20 hover:bg-white/20 hover:backdrop-brightness-200 hover:backdrop-saturate-200 border border-white/50  items-center justify-center"
						onPress={onRemove}
					>
						<Icon name="x" size="xs" />
					</Button>
				</div>
			</div>
		</div>
	);
}
