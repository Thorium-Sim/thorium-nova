import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Select from "@thorium/ui/Select";
import { useState } from "react";

export function RoomSelector({
	roomId,
	setRoomId,
}: {
	roomId: number | null;
	setRoomId: (roomId: number | null) => void;
}) {
	const { shipId } = useStation();
	const [{ decks, rooms }] = q.ship.rooms.useNetRequest({ shipId });
	const [selectedDeckIndex, setSelectedDeckIndex] = useState<number | null>();
	const deckIndex = rooms.find((r) => r.id === roomId)?.deckIndex ?? selectedDeckIndex;
	return (
		<div className="flex gap-2">
			<Select
				className="flex-auto"
				buttonClassName="btn-primary"
				placeholder="Select Deck"
				items={decks.map((d) => ({ id: d.name, label: d.name }))}
				label="Deck"
				selected={typeof deckIndex === "number" ? decks[deckIndex].name : null}
				setSelected={(deck) => setSelectedDeckIndex(decks.findIndex((d) => d.name === deck))}
			/>
			<Select
				className="flex-auto"
				buttonClassName="btn-primary"
				placeholder="Select Room"
				disabled={selectedDeckIndex === null}
				items={rooms
					.flatMap((d) => (d.deckIndex === deckIndex ? { id: d.id, label: d.name || "" } : []))
					.sort((a, b) => a.label.localeCompare(b.label))}
				label="Room"
				selected={roomId}
				setSelected={(room) => setRoomId(room)}
			/>
		</div>
	);
}
