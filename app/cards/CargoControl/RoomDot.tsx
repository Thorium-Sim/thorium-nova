import {
	flip,
	offset,
	shift,
	useFloating,
	useInteractions,
	useRole,
	useHover,
} from "@floating-ui/react";
import { useState } from "react";

import { useShipMapStore } from "./useShipMapStore";

export function RoomDot({
	id,
	position,
	name,
}: {
	id: number;
	name: string;
	position: { x: number; y: number };
}) {
	const selectedRoomId = useShipMapStore((state) => state.selectedRoomId);
	const isSelected = selectedRoomId === id;

	const [open, setOpen] = useState(false);

	const { x, y, refs, strategy, context } = useFloating({
		placement: "left",
		middleware: [offset(10), flip(), shift()],
		open,
		onOpenChange: setOpen,
	});

	const { getReferenceProps, getFloatingProps } = useInteractions([
		useHover(context),
		useRole(context, { role: "tooltip" }),
	]);

	return (
		<>
			<div
				className="absolute flex h-4 w-4 cursor-pointer"
				style={{
					transform: `translate(calc(${position.x}px - 0.5rem), calc(${position.y}px - 0.5rem))`,
				}}
			>
				<div
					className={`h-4 w-4 ${
						isSelected ? "bg-sky-400 shadow-md ring-2 ring-sky-300" : "bg-green-300"
					} pointer-events-auto rounded-full`}
					ref={refs.setReference}
					onClick={() => useShipMapStore.setState({ selectedRoomId: id })}
					{...getReferenceProps()}
				/>
				{isSelected && (
					<span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-sky-400" />
				)}
			</div>
			{open && (
				<div
					ref={refs.setFloating}
					style={{
						position: strategy,
						top: y ?? 0,
						left: x ?? 0,
					}}
					className="z-50 rounded border-2 border-white/50 bg-black/90 px-2 py-1 text-2xl text-white drop-shadow-xl"
					{...getFloatingProps()}
				>
					{name}
				</div>
			)}
		</>
	);
}
