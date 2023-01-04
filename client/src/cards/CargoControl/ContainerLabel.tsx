import {q} from "@client/context/AppContext";
import {useShipMapStore} from "./useShipMapStore";

export function ContainerLabel() {
  const selectedContainerId = useShipMapStore(
    state => state.selectedContainerId
  );
  const [cargoRooms] = q.cargoControl.rooms.useNetRequest();
  const [cargoContainers] = q.cargoControl.containers.useNetRequest();

  const selectedContainer = cargoContainers.find(
    c => c.id === selectedContainerId
  );

  const containerRoom = cargoRooms.rooms.find(
    room => room.id === selectedContainer?.destinationNode
  );

  return (
    <span className="flex justify-between flex-wrap">
      <h3 className="text-xl ">
        {selectedContainer
          ? `${selectedContainer.name} (${selectedContainer.used} / ${selectedContainer.volume})`
          : "Choose a container"}
      </h3>
      {containerRoom && (
        <span>
          {selectedContainer?.entityState === "enRoute" ? "En route to " : ""}
          {containerRoom?.name}, {containerRoom.deck}
        </span>
      )}
    </span>
  );
}
