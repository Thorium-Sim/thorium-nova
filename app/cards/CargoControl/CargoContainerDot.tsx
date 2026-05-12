import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useRef } from "react";

import { useShipMapStore } from "./useShipMapStore";

export function CargoContainerDot(props: {
	id: number;
	position: { x: number; y: number; z: number };
	deckIndex: number;
}) {
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();
	const dotRef = useRef<SVGGElement>(null);
	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);
	const isSelected = selectedContainerId === props.id;

	useAnimationFrame(() => {
		if (!dotRef.current) return;
		const position = interpolate(props.id);
		if (position) {
			if (Math.round(position.z || 0) === props.deckIndex) {
				dotRef.current.style.display = "";
			} else {
				dotRef.current.style.display = "none";
			}
			dotRef.current.setAttribute(
				"transform",
				`translate(${position.x * 1.086}, ${position.y * 1.086})`,
			);
		}
	}, cardLoaded);

	return (
		<g
			transform={`translate(${props.position.x * 1.086}, ${props.position.y * 1.086})`}
			style={{ display: Math.round(props.position.z || 0) === props.deckIndex ? "" : "none" }}
			ref={dotRef}
		>
			<circle r={2} className={cn("fill-purple-400", { "animate-ping": isSelected })} />
			<circle
				r={2}
				className={cn({ "fill-orange-400": !isSelected, "fill-purple-400": isSelected })}

				// <div
				// 	className={`inline-flex h-2 w-2 rounded-full transition-colors ${
				// 		isSelected ? "bg-purple-500" : "bg-orange-400"
				// 	} relative`}
				// />
				// {isSelected && (
				// 	<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400" />
				// )}
			/>
		</g>
	);
}
