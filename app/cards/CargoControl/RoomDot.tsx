import { clientId, q } from "@thorium/context/AppContext";
import { cn } from "@thorium/utils/cn";
import { useEffect, useRef, type SVGProps } from "react";

import { useShipMapStore } from "./useShipMapStore";

export function RoomDot({
	id,
	position,
	name,
	sizeRatio,
	...props
}: {
	id: number;
	position: { x: number; y: number };
	name: string;
	sizeRatio: number;
} & Omit<SVGProps<SVGCircleElement>, "id">) {
	const selectedRoomId = useShipMapStore((state) => state.selectedRoomId);
	const isSelected = selectedRoomId === id;

	function click() {
		useShipMapStore.setState({ selectedRoomId: id });
		q.thorium.genericEvent.netSend({
			clientId,
			eventName: "room-dot-selected",
			properties: `${id}`,
		});
	}
	return (
		<>
			<circle
				data-testid="room-dot"
				aria-label={name}
				cx={position.x}
				cy={position.y}
				r={5 / sizeRatio}
				className={cn("fill-green-300 cursor-pointer pointer-events-auto", {
					"fill-sky-400": isSelected,
				})}
				style={{ anchorName: `--room-${id}` }}
				onClick={click}
				{...props}
			/>
			{isSelected && (
				<circle
					cx={position.x}
					cy={position.y}
					r={5 / sizeRatio}
					className={cn("fill-green-300 cursor-pointer", {
						"fill-sky-400 animate-ping": isSelected,
					})}
					style={{ transformOrigin: `${position.x}px ${position.y}px` }}
					onClick={click}
				/>
			)}
		</>
	);
}

export function RoomDotLabel({
	name,
	position,
	tooltipShown,
	sizeRatio,
}: {
	name: string;
	position: { x: number; y: number };
	tooltipShown: boolean;
	sizeRatio: number;
}) {
	const textBg = useRef<SVGRectElement>(null);
	const text = useRef<SVGTextElement>(null);

	useEffect(() => {
		if (text.current && textBg.current) {
			let bbox = text.current.getBBox();
			if (bbox.width + bbox.x > text.current.ownerSVGElement!.getBBox().width) {
				text.current.setAttribute("x", `${position.x - bbox.width - 10 / sizeRatio}`);
			}
			bbox = text.current.getBBox();
			textBg.current.setAttribute("width", `${bbox.width + 6 / sizeRatio}`);
			textBg.current.setAttribute("height", `${bbox.height + 2 / sizeRatio}`);
			textBg.current.setAttribute("x", `${bbox.x - 4 / sizeRatio}`);
			textBg.current.setAttribute("y", `${bbox.y - 1 / sizeRatio}`);
		}
	}, []);
	return (
		<>
			<style>
				{`
				text {
	font-size: 1px;
}`}
			</style>
			<g className={tooltipShown ? "" : "hidden"}>
				<rect
					ref={textBg}
					className="stroke fill-black/80 stroke-white/50"
					rx={2 / sizeRatio}
					style={{
						strokeWidth: 1 / sizeRatio,
					}}
				/>
				<text
					ref={text}
					x={position.x + 10 / sizeRatio}
					y={position.y + 3 / sizeRatio}
					className="fill-white"
					style={{
						fontSize: `${10 / sizeRatio}px`,
					}}
				>
					{name}
				</text>
			</g>
		</>
	);
}
