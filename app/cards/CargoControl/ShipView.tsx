import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { Suspense } from "react";

import { useShipMapStore } from "./useShipMapStore";

type DeckChildren = (
	deck: { name: string },
	deckIndex: number,
	ref: RefObject<HTMLDivElement | null>,
) => ReactNode;

export function ShipView({
	deckIndex,
	deckChildren,
}: {
	deckIndex: number;
	cardLoaded: boolean;
	deckChildren?: DeckChildren;
}) {
	const { shipId } = useStation();
	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });

	const { decks } = cargoRooms;

	return (
		<div
			id="deck-container"
			className="relative h-full w-full justify-self-center overflow-hidden select-none"
		>
			<Suspense fallback={null}>
				{decks.map((d, i) => (
					<Deck key={d.name} d={d} i={i} deckIndex={deckIndex} deckChildren={deckChildren} />
				))}
			</Suspense>
		</div>
	);
}

function Deck({
	d,
	i,
	deckIndex,
	deckChildren,
}: {
	d: { name: string; backgroundUrl?: string };
	i: number;
	deckIndex: number;
	deckChildren?: DeckChildren;
}) {
	const ref = useRef<HTMLDivElement>(null);

	const onClick = useCallback(() => useShipMapStore.setState({ selectedRoomId: null }), []);
	return (
		<div
			id={d.name}
			className="pointer-events-none absolute w-full origin-top"
			style={{
				transition: "opacity 0.2s ease",
			}}
		>
			<div
				className={`relative transition-all duration-500 ${
					deckIndex === i ? "deck-on" : deckIndex < i ? "deck-before" : "deck-after"
				}`}
			>
				{deckChildren?.(d, i, ref)}

				<SVGImageLoader
					url={d.backgroundUrl || ""}
					onClick={onClick}
					className="pointer-events-none outline-none"
					ref={ref}
				/>
			</div>
		</div>
	);
}
