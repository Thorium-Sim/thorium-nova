import { Tooltip } from "@thorium/ui/Tooltip";
import { useShipMapStore } from "./useShipMapStore";
import { Icon } from "@thorium/ui/Icon";

export function GoToRoomButton({
	decks,
	currentDeckIndex,
	selectedRoom,
}: {
	decks: { name: string }[];
	currentDeckIndex: number;
	selectedRoom: { deck: string | undefined };
}) {
	const deckIndex = decks.findIndex((d) => d.name === selectedRoom.deck);
	if (deckIndex === currentDeckIndex) return null;
	return (
		<Tooltip content="Go To Room">
			<button
				className="px-4 cursor-pointer"
				onClick={() => {
					useShipMapStore.setState({ deckIndex });
				}}
				aria-label="Go To Room"
			>
				<Icon name="log-out" />
			</button>
		</Tooltip>
	);
}
