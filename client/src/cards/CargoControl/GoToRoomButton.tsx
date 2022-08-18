import {Tooltip} from "@thorium/ui/Tooltip";
import {MdLogout} from "react-icons/md";
import {useShipMapStore} from "./useShipMapStore";

export function GoToRoomButton({
  decks,
  currentDeckIndex,
  selectedRoom,
}: {
  decks: {name: string}[];
  currentDeckIndex: number;
  selectedRoom: {deck: string | undefined};
}) {
  const deckIndex = decks.findIndex(d => d.name === selectedRoom.deck);
  if (deckIndex === currentDeckIndex) return null;
  return (
    <Tooltip content="Go To Room">
      <button
        className="px-4 cursor-pointer"
        onClick={() => {
          useShipMapStore.setState({deckIndex});
        }}
        aria-label="Go To Room"
      >
        <MdLogout />
      </button>
    </Tooltip>
  );
}
