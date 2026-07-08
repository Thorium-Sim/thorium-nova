import { clientId, q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";
import { useLiveQuery } from "@thorium/utils/live-query/client";

import { useShipMapStore } from "./useShipMapStore";

export function CargoContainerList() {
	const { shipId } = useStation();

	const [cargoContainers] = q.cargoControl.containers.useNetRequest({ shipId });

	return (
		<div className="cargo-container-list row-span-2 flex h-full cursor-pointer flex-col justify-center gap-4">
			{cargoContainers.map((container) => (
				<CargoContainer key={container.id} container={container} />
			))}
		</div>
	);
}

function CargoContainer({
	container,
}: {
	container: {
		id: number;
		destinationNode: number | null;
		entityState: "idle" | "enRoute";
	};
}) {
	const { shipId } = useStation();

	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });
	const { rooms } = cargoRooms;

	const selectedRoomId = useShipMapStore((state) => state.selectedRoomId);
	const { interpolate } = useLiveQuery();

	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);
	const isSelected = container.id === selectedContainerId;
	const inRoom = container.destinationNode === selectedRoomId;
	const destinationRoom = rooms.find((room) => room.id === container.destinationNode);
	return (
		<button
			className={`relative flex aspect-square w-full items-center justify-center rounded-full border border-white text-3xl transition-colors ${
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
				useShipMapStore.setState({ selectedContainerId: container.id });
				q.thorium.genericEvent.netSend({
					clientId,
					eventName: "cargo-container-selected",
					properties: `${container.id}`,
				});
			}}
		>
			<Icon name="package-open" />
			{inRoom && !isSelected && (
				<Tooltip
					placement="left"
					content={`Container is ${
						container.entityState === "idle" ? "present in" : "en route to"
					} the selected room.`}
				>
					<div
						className={`absolute top-0 right-0 rounded-full ${
							container.entityState === "idle" ? "bg-blue-400" : "bg-orange-400"
						} h-3 w-3`}
					/>
				</Tooltip>
			)}
			{destinationRoom && container.entityState === "enRoute" && (
				<Tooltip
					content={
						<span>
							Container is en route to <span className="inline-block">{destinationRoom.name},</span>{" "}
							<span className="inline-block">{destinationRoom.deck}.</span>
						</span>
					}
				>
					<div className="absolute bottom-0 left-0 rounded-full border border-white bg-black p-0.5 text-xs">
						<Icon name="chevron-right" />
					</div>
				</Tooltip>
			)}
		</button>
	);
}
