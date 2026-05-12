import { cn } from "@thorium/utils/cn";
import { useEffect, useRef, type SVGProps } from "react";

import { useShipMapStore } from "./useShipMapStore";

export function RoomDot({
	id,
	position,
	...props
}: {
	id: number;
	position: { x: number; y: number };
} & Omit<SVGProps<SVGCircleElement>, "id">) {
	const selectedRoomId = useShipMapStore((state) => state.selectedRoomId);
	const isSelected = selectedRoomId === id;

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
				{...props}
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
		</>
	);
}

export function RoomDotLabel({
	name,
	position,
	tooltipShown,
}: {
	name: string;
	position: { x: number; y: number };
	tooltipShown: boolean;
}) {
	const textBg = useRef<SVGRectElement>(null);
	const text = useRef<SVGTextElement>(null);

	useEffect(() => {
		if (text.current && textBg.current) {
			let bbox = text.current.getBBox();
			if (bbox.width + bbox.x > text.current.ownerSVGElement!.getBBox().width) {
				text.current.setAttribute("x", `${position.x - bbox.width - 10}`);
			}
			bbox = text.current.getBBox();
			textBg.current.setAttribute("width", `${bbox.width + 4}`);
			textBg.current.setAttribute("height", `${bbox.height + 2}`);
			textBg.current.setAttribute("x", `${bbox.x - 2}`);
			textBg.current.setAttribute("y", `${bbox.y - 1}`);
		}
	}, []);
	return (
		<>
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
