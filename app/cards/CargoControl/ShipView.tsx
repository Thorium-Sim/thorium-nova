import { q } from "@thorium/context/AppContext";
import { useResizeObserver } from "@thorium/hooks/useResizeObserver";
import { useStation } from "@thorium/routes/station/useStation";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { pixelRatio } from "@thorium/utils/pixelRatio.client";
import { useEffect, useState } from "react";
import { Suspense } from "react";

import { CargoContainerDot } from "./CargoContainerDot";
import { RoomDot } from "./RoomDot";
import { useShipMapStore } from "./useShipMapStore";

export function ShipView({ deckIndex, cardLoaded }: { deckIndex: number; cardLoaded: boolean }) {
	const { shipId } = useStation();
	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });

	const { decks, rooms, shipLength } = cargoRooms;
	const [cargoContainers] = q.cargoControl.containers.useNetRequest({ shipId });

	const [ref, dims] = useResizeObserver();
	const [imgRef, imgDims, imgMeasure] = useResizeObserver();

	const transform = {
		x: dims.width / 2 - imgDims.width / 2,
		y: dims.height / 2 - imgDims.height / 2,
		widthScale: imgDims.width / pixelRatio / shipLength,
	};

	const [transformationLoaded] = useState(true);

	useEffect(() => {
		if (cardLoaded) {
			imgMeasure();
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
							{rooms.map((room) =>
								room.deck === d.name ? (
									<RoomDot
										key={room.id}
										id={room.id}
										name={room.name || ""}
										position={{
											x: room.position.x * pixelRatio * transform.widthScale,
											y: room.position.y * pixelRatio * transform.widthScale,
										}}
									/>
								) : null,
							)}
							{cargoContainers.map(
								(container) =>
									container.position && (
										<CargoContainerDot
											key={container.id}
											id={container.id}
											position={container.position}
											widthScale={transform.widthScale}
											deckIndex={i}
										/>
									),
							)}

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
