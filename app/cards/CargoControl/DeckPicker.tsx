import { useShipMapStore } from "./useShipMapStore";

export function DeckPicker({ decks }: { decks: { name: string }[] }) {
	const deckIndex = useShipMapStore((store) => store.deckIndex);
	return (
		<ul className="row-span-2 self-center overflow-y-auto select-none">
			{decks.map((deck, index) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents:
				<li
					key={deck.name}
					onClick={() => useShipMapStore.setState({ deckIndex: index })}
					className={`pointer-events-auto cursor-pointer list-group-item ${
						index === deckIndex ? "selected" : ""
					}`}
				>
					{deck.name}
				</li>
			))}
		</ul>
	);
}
