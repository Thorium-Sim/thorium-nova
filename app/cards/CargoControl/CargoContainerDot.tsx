import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { pixelRatio } from "@thorium/utils/pixelRatio.client";
import { useRef } from "react";

import { useShipMapStore } from "./useShipMapStore";

export function CargoContainerDot(props: {
	id: number;
	position: { x: number; y: number; z: number };
	deckIndex: number;
	widthScale: number;
}) {
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();
	const dotRef = useRef<HTMLDivElement>(null);
	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);
	const isSelected = selectedContainerId === props.id;

	useAnimationFrame(() => {
		if (!dotRef.current) return;
		const position = interpolate(props.id);
		if (position) {
			if (Math.round(position.z || 0) === props.deckIndex) {
				dotRef.current.style.display = "flex";
			} else {
				dotRef.current.style.display = "none";
			}
			dotRef.current.style.transform = `translate(calc(${
				position.x * pixelRatio * props.widthScale
			}px - 0.25rem), calc(${position.y * pixelRatio * props.widthScale}px - 0.25rem))`;
		}
	}, cardLoaded);

	return (
		<div
			ref={dotRef}
			className={`absolute flex h-2 w-2`}
			style={{
				display: Math.round(props.position.z || 0) === props.deckIndex ? "flex" : "none",
				transform: `translate(calc(${
					props.position?.x || 0
				}px - 0.125rem), calc(${props.position?.y || 0}px - 0.125rem))`,
			}}
		>
			<div
				className={`inline-flex h-2 w-2 rounded-full transition-colors ${
					isSelected ? "bg-purple-500" : "bg-orange-400"
				} relative`}
			/>
			{isSelected && (
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400" />
			)}
		</div>
	);
}
