import {Tooltip} from "@thorium/ui/Tooltip";
import {useThorium} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import {FaBoxOpen, FaChevronRight} from "react-icons/fa";
import {useShipMapStore} from "./index";

export function CargoContainerList() {
  const cargoContainers = useNetRequest("cargoContainers");
  const cargoRooms = useNetRequest("cargoRooms");
  const {rooms} = cargoRooms;

  const selectedRoomId = useShipMapStore(state => state.selectedRoomId);
  const {interpolate} = useThorium();

  return (
    <div className="flex flex-col h-full gap-4 justify-center row-span-2 cursor-pointer">
      {cargoContainers.map(container => {
        const selectedContainerId = useShipMapStore(
          state => state.selectedContainerId
        );
        const isSelected = container.id === selectedContainerId;
        const inRoom = container.destinationNode === selectedRoomId;
        const destinationRoom = rooms.find(
          room => room.id === container.destinationNode
        );
        return (
          <button
            key={container.id}
            className={`relative flex justify-center items-center text-3xl  transition-colors aspect-square w-full rounded-full border border-white ${
              isSelected
                ? "bg-primary-focus/75 hover:bg-primary-focus"
                : "bg-transparent hover:bg-white/25"
            }`}
            onClick={() => {
              const containerPosition = interpolate(container.id);
              if (!containerPosition) return;
              useShipMapStore.setState({
                deckIndex: Math.round(containerPosition.z || 0),
              });
              useShipMapStore.setState({selectedContainerId: container.id});
            }}
          >
            <FaBoxOpen />
            {inRoom && !isSelected && (
              <Tooltip
                placement="left"
                content={`Container is ${
                  container.entityState === "idle"
                    ? "present in"
                    : "en route to"
                } the selected room.`}
              >
                <div
                  className={`absolute top-0 right-0 rounded-full ${
                    container.entityState === "idle"
                      ? "bg-blue-400"
                      : "bg-orange-400"
                  } w-3 h-3`}
                />
              </Tooltip>
            )}
            {destinationRoom && container.entityState === "enRoute" && (
              <Tooltip
                content={
                  <span>
                    Container is en route to{" "}
                    <span className="inline-block">
                      {destinationRoom.name},
                    </span>{" "}
                    <span className="inline-block">
                      {destinationRoom.deck}.
                    </span>
                  </span>
                }
              >
                <div className="absolute bottom-0 left-0 rounded-full text-xs bg-black p-0.5 border border-white">
                  <FaChevronRight />
                </div>
              </Tooltip>
            )}
          </button>
        );
      })}
    </div>
  );
}
