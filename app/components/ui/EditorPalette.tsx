import * as React from "react";
import { useDrag } from "@use-gesture/react";
import { animated } from "@react-spring/web";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { Icon } from "./Icon";
import { Portal } from "@thorium/ui/Portal";

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
				// @ts-expect-error
				className="w-64 max-h-96 flex flex-col bg-gray-900 shadow-lg rounded-lg fixed left-[calc(50%-6rem)] top-[calc(50%-8rem)]"
				style={{
					x,
					y,
				}}
			>
				<div
					className={`w-full h-8 bg-gray-800 text-white font-bold flex items-center justify-between select-none touch-none cursor-grab active:cursor-grabbing rounded-t-lg ${
						minimized ? "rounded-b-lg" : ""
					}`}
					{...bind()}
				>
					<button
						className="p-1 ml-1 rounded-full hover:bg-white/10 cursor-pointer"
						onClick={onClose}
						aria-label="Close"
					>
						<Icon name="x" />
					</button>
					<span className="flex-1 text-center">Editor</span>
					<button
						className="p-1 mr-1 rounded-full hover:bg-white/10 cursor-pointer"
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
