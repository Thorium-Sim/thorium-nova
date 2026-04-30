import type { CardProps } from "@thorium/cards/CardProps";
import { DeckPicker } from "@thorium/cards/CargoControl/DeckPicker";
import { RoomDot } from "@thorium/cards/CargoControl/RoomDot";
import { ShipView } from "@thorium/cards/CargoControl/ShipView";
import { useShipMapStore } from "@thorium/cards/CargoControl/useShipMapStore";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { pixelRatio } from "@thorium/utils/pixelRatio.client";

export function Exocomps(props: CardProps) {
	const { shipId } = useStation();
	const deckIndex = useShipMapStore((state) => state.deckIndex);

	const [systemRooms] = q.exocomps.rooms.useNetRequest({ shipId });
	const { decks } = systemRooms;

	const maxDeckName = Math.max(...decks.map((d) => d.name.length));

	return (
		<div
			className="relative mx-auto grid h-full grid-rows-2 gap-8"
			style={{
				gridTemplateColumns: `calc(${maxDeckName}ch + 1.25rem) 1fr 30% 50px`,
			}}
		>
			<DeckPicker decks={decks} />
			<div className="row-span-2">
				<ShipView
					deckIndex={deckIndex}
					cardLoaded={props.cardLoaded}
					deckChildren={(deck) => (
						<>
							<SystemRooms deck={deck} />
						</>
					)}
				></ShipView>
			</div>
		</div>
	);
}

function SystemRooms({ deck }: { deck: { name: string } }) {
	const { shipId } = useStation();

	const [systemRooms] = q.exocomps.rooms.useNetRequest({ shipId });
	const transform = useShipMapStore((state) => state.transform);

	const { rooms } = systemRooms;

	return rooms.map((room) =>
		room.deck === deck.name ? (
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
	);
}
