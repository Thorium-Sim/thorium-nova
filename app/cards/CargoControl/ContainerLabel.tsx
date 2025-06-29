import { q } from "@thorium/context/AppContext";
import { useShipMapStore } from "./useShipMapStore";
import { useStation } from "@thorium/routes/station/useStation";

export function ContainerLabel() {
	const { shipId } = useStation();

	const selectedContainerId = useShipMapStore(
		(state) => state.selectedContainerId,
	);
	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });
	const [cargoContainers] = q.cargoControl.containers.useNetRequest({ shipId });

	const selectedContainer = cargoContainers.find(
		(c) => c.id === selectedContainerId,
	);

	const containerRoom = cargoRooms.rooms.find(
		(room) => room.id === selectedContainer?.destinationNode,
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
