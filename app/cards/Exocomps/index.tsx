import type { CardProps } from "@thorium/cards/CardProps";
import { DeckPicker } from "@thorium/cards/CargoControl/DeckPicker";
import { ShipView } from "@thorium/cards/CargoControl/ShipView";
import { useShipMapStore } from "@thorium/cards/CargoControl/useShipMapStore";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";

export function Exocomps(props: CardProps) {
	const { shipId } = useStation();
	const deckIndex = useShipMapStore((state) => state.deckIndex);

	const [cargoRooms] = q.exocomps.rooms.useNetRequest({ shipId });
	const { decks } = cargoRooms;

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
				<ShipView deckIndex={deckIndex} cardLoaded={props.cardLoaded} />
			</div>
		</div>
	);
}
