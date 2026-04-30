import { cn } from "@thorium/utils/cn";
import { useEffect, useRef, useState } from "react";

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

	const textBg = useRef<SVGRectElement>(null);
	const text = useRef<SVGTextElement>(null);
	const [tooltipShown, setTooltipShown] = useState(false);

	useEffect(() => {
		if (text.current && textBg.current) {
			const bbox = text.current.getBBox();
			textBg.current.setAttribute("width", `${bbox.width + 4}`);
			textBg.current.setAttribute("height", `${bbox.height + 2}`);
			textBg.current.setAttribute("x", `${bbox.x - 2}`);
			textBg.current.setAttribute("y", `${bbox.y - 1}`);
		}
	}, []);
	return (
		<>
			<circle
				cx={position.x}
				cy={position.y}
				r={5}
				className={cn("fill-green-300 cursor-pointer pointer-events-auto", {
					"fill-sky-400": isSelected,
				})}
				style={{ anchorName: `--room-${id}` }}
				onClick={() => useShipMapStore.setState({ selectedRoomId: id })}
				onPointerEnter={() => setTooltipShown(true)}
				onPointerLeave={() => setTooltipShown(false)}
			/>
			{isSelected && (
				<circle
					cx={position.x}
					cy={position.y}
					r={5}
					className={cn("fill-green-300 cursor-pointer", {
						"fill-sky-400 animate-ping": isSelected,
					})}
					style={{ transformOrigin: `${position.x}px ${position.y}px` }}
					onClick={() => useShipMapStore.setState({ selectedRoomId: id })}
				/>
			)}
			<style>
				{`
				text {
	font: 1px;
}`}
			</style>
			<g className={tooltipShown ? "" : "hidden"}>
				<rect ref={textBg} className="stroke fill-black/80 stroke-white/50" rx={2} />
				<text ref={text} x={position.x + 10} y={position.y + 3} className="fill-white text-[10px]">
					{name}
				</text>
			</g>
		</>
	);
}
