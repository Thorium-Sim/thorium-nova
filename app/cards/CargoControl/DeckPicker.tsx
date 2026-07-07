import { clientId, q } from "@thorium/context/AppContext";

import { useShipMapStore } from "./useShipMapStore";

export function DeckPicker({ decks }: { decks: { name: string }[] }) {
	const deckIndex = useShipMapStore((store) => store.deckIndex);
	return (
		<ul className="deck-picker row-span-2 self-center overflow-y-auto select-none">
			{decks.map((deck, index) => (
				<li
					key={deck.name}
					onClick={() => {
						useShipMapStore.setState({ deckIndex: index });
						q.thorium.genericEvent.netSend({
							clientId,
							eventName: "deck-picked",
							properties: `${index}`,
						});
					}}
					className={`list-group-item pointer-events-auto cursor-pointer ${
						index === deckIndex ? "selected" : ""
					}`}
				>
					{deck.name}
				</li>
			))}
		</ul>
	);
}
