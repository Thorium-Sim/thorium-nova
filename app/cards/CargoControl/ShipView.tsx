import { q } from "@thorium/context/AppContext";
import { useResizeObserver } from "@thorium/hooks/useResizeObserver";
import { useStation } from "@thorium/routes/station/useStation";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { pixelRatio } from "@thorium/utils/pixelRatio.client";
import { useEffect, useState, type ReactNode } from "react";
import { Suspense } from "react";

import { useShipMapStore } from "./useShipMapStore";

export function ShipView({
	deckIndex,
	cardLoaded,
	deckChildren,
}: {
	deckIndex: number;
	cardLoaded: boolean;
	deckChildren?: (deck: { name: string }, deckIndex: number) => ReactNode;
}) {
	const { shipId } = useStation();
	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });

	const { decks, shipLength } = cargoRooms;

	const [ref, dims] = useResizeObserver();
	const [imgRef, _, imgMeasure] = useResizeObserver();

	const [transformationLoaded] = useState(true);

	const transform = useShipMapStore((state) => state.transform);
	useEffect(() => {
		if (cardLoaded) {
			const imgDims = imgMeasure();
			if (imgDims) {
				useShipMapStore.setState({
					transform: {
						x: dims.width / 2 - imgDims.width / 2,
						y: dims.height / 2 - imgDims.height / 2,
						widthScale: imgDims.width / pixelRatio / shipLength,
					},
				});
			}
		}
	}, [cardLoaded, imgMeasure]);
	return (
		<div
			id="deck-container"
			className="relative h-full w-full justify-self-center overflow-hidden select-none"
			ref={ref}
		>
			<Suspense fallback={null}>
				{decks.map((d, i) => (
					<div
						id={d.name}
						className="pointer-events-none absolute w-full origin-top"
						key={d.name}
						style={{
							transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
							transition: "opacity 0.2s ease",
							opacity: transformationLoaded ? 1 : 0,
						}}
						ref={i === 0 ? imgRef : null}
					>
						<div
							className={`relative transition-all duration-500 ${
								deckIndex === i ? "deck-on" : deckIndex < i ? "deck-before" : "deck-after"
							}`}
						>
							{deckChildren?.(d, i)}

							<SVGImageLoader
								url={d.backgroundUrl || ""}
								onClick={() => useShipMapStore.setState({ selectedRoomId: null })}
								className="pointer-events-auto"
								onLoad={() => imgMeasure()}
							/>
						</div>
					</div>
				))}
			</Suspense>
		</div>
	);
}
