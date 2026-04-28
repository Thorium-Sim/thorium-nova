import { animated } from "@react-spring/web";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { Portal } from "@thorium/ui/Portal";
import { useDrag } from "@use-gesture/react";
import * as React from "react";

import { Icon } from "./Icon";

export function EditorPalette({
	isOpen,
	onClose,
	children,
}: {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
}) {
	const [position, setXY] = useLocalStorage("editorPalettePosition", [0, 0]);
	const x = position[0];
	const y = position[1];

	const bind = useDrag(
		({ offset: [x, y] }) => {
			setXY([x, y]);
		},
		{
			from: [x, y],
			filterTaps: true,
		},
	);
	const [minimized, setMinimized] = React.useState(false);

	if (!isOpen) return null;

	return (
		<Portal>
			<animated.div
				className="fixed top-[calc(50%-8rem)] left-[calc(50%-6rem)] flex max-h-96 w-64 flex-col rounded-lg bg-gray-900 shadow-lg"
				style={{
					x,
					y,
				}}
			>
				<div
					className={`flex h-8 w-full cursor-grab touch-none items-center justify-between rounded-t-lg bg-gray-800 font-bold text-white select-none active:cursor-grabbing ${
						minimized ? "rounded-b-lg" : ""
					}`}
					{...bind()}
				>
					<button
						className="ml-1 cursor-pointer rounded-full p-1 hover:bg-white/10"
						onClick={onClose}
						aria-label="Close"
					>
						<Icon name="x" />
					</button>
					<span className="flex-1 text-center">Editor</span>
					<button
						className="mr-1 cursor-pointer rounded-full p-1 hover:bg-white/10"
						onClick={() => setMinimized((s) => !s)}
						aria-label="Minimize"
					>
						<Icon name="minus" />
					</button>
				</div>
				{minimized ? null : children}
			</animated.div>
		</Portal>
	);
}
