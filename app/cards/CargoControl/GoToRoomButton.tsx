import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";

import { useShipMapStore } from "./useShipMapStore";

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
				className="cursor-pointer px-4"
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
