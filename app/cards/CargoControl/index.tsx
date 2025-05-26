import Button from "@thorium/ui/Button";
import "./style.css";
import { toast } from "@thorium/context/ToastContext";
import { ContainerLabel } from "./ContainerLabel";
import { CargoSearchInput } from "./CargoSearchInput";
import { useTransferAmount } from "./useTransferAmount";
import { CargoContainerList } from "./CargoContainerList";
import { CargoList } from "./CargoList";
import { GoToRoomButton } from "./GoToRoomButton";
import { ShipView } from "./ShipView";
import { useShipMapStore } from "./useShipMapStore";
import { q } from "@thorium/context/AppContext";
import { DeckPicker } from "./DeckPicker";
import type { CardProps } from "@thorium/cards/CardProps";
import { useStation } from "@thorium/routes/station/useStation";

export function CargoControl(props: CardProps) {
	const { shipId } = useStation();
	const selectedRoomId = useShipMapStore((state) => state.selectedRoomId);
	const selectedContainerId = useShipMapStore(
		(state) => state.selectedContainerId,
	);
	const deckIndex = useShipMapStore((state) => state.deckIndex);

	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });
	const [cargoContainers] = q.cargoControl.containers.useNetRequest({ shipId });
	q.cargoControl.stream.useDataStream({ shipId });
	const { rooms, decks } = cargoRooms;

	const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
	const selectedContainer = cargoContainers.find(
		(c) => c.id === selectedContainerId,
	);

	const enRouteContainer = cargoContainers.find(
		(container) =>
			selectedRoomId && container.destinationNode === selectedRoomId,
	);

	const transferAmount = useTransferAmount();
	const maxDeckName = Math.max(...decks.map((d) => d.name.length));
	return (
		<div
			className="mx-auto h-full relative grid grid-rows-2 gap-8"
			style={{
				gridTemplateColumns: `calc(${maxDeckName}ch + 1.25rem) 1fr 30% 50px`,
			}}
		>
			<DeckPicker decks={decks} />
			<div className="row-span-2">
				<div className="w-1/3 mx-auto z-10">
					<CargoSearchInput />
				</div>
				<ShipView deckIndex={deckIndex} cardLoaded={props.cardLoaded} />
			</div>
			<div className="h-full flex flex-col ">
				<h3 className="text-xl">
					{selectedRoom ? (
						<span className="flex justify-between">
							<span>
								{selectedRoom.name} ({selectedRoom.used} / {selectedRoom.volume}
								)
							</span>
							<GoToRoomButton
								decks={decks}
								selectedRoom={selectedRoom}
								currentDeckIndex={deckIndex}
							/>
						</span>
					) : (
						"Choose a room"
					)}
				</h3>
				<CargoList
					selectedRoom={selectedRoom}
					enRouteContainerId={enRouteContainer?.id}
					selectedContainerId={selectedContainerId}
					onClick={async (key: string) => {
						if (
							selectedRoom?.id &&
							enRouteContainer?.id === selectedContainerId
						) {
							try {
								await q.cargoControl.transfer.netSend({
									fromId: { type: "room", id: selectedRoom?.id, shipId },
									toId: { type: "entity", id: selectedContainerId, shipId },
									transfers: [{ item: key, count: transferAmount }],
								});
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error transferring cargo",
										body: err.message,
										color: "error",
									});
								}
							}
						}
					}}
				/>
				<div className="h-10 w-full flex items-center justify-center">
					{enRouteContainer?.entityState === "enRoute" ? (
						<Button className="w-full btn-disabled" disabled>
							{enRouteContainer.name} En Route
						</Button>
					) : enRouteContainer?.entityState === "idle" &&
						enRouteContainer.id === selectedContainerId ? (
						<p>Click cargo line to transfer {transferAmount} item</p>
					) : (
						<Button
							className={`w-full ${
								!selectedRoomId ? "btn-disabled" : "btn-primary"
							}`}
							disabled={!selectedRoomId}
							onClick={async () => {
								if (typeof selectedRoomId === "number") {
									try {
										await q.cargoControl.containerSummon.netSend({
											roomId: selectedRoomId,
											shipId,
										});
									} catch (err) {
										if (err instanceof Error) {
											toast({
												title: "Error sending container",
												body: err.message,
												color: "error",
											});
										}
									}
								}
							}}
						>
							Summon Closest Container
						</Button>
					)}
				</div>
			</div>

			<CargoContainerList />
			<div className="h-full flex flex-col ">
				<ContainerLabel />
				<CargoList
					selectedRoom={selectedContainer}
					enRouteContainerId={enRouteContainer?.id}
					selectedContainerId={selectedContainerId}
					onClick={async (key) => {
						if (enRouteContainer?.id === selectedContainerId && selectedRoom) {
							try {
								await q.cargoControl.transfer.netSend({
									toId: { type: "room", id: selectedRoom.id, shipId },
									fromId: { type: "entity", id: selectedContainerId, shipId },
									transfers: [{ item: key, count: transferAmount }],
								});
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error transferring cargo",
										body: err.message,
										color: "error",
									});
								}
							}
						}
					}}
				/>

				<Button
					className={`${
						selectedContainer?.destinationNode === selectedRoomId ||
						!selectedRoom ||
						!selectedContainer
							? "btn-disabled"
							: "btn-primary"
					}`}
					disabled={
						selectedContainer?.destinationNode === selectedRoomId ||
						!selectedRoom ||
						!selectedContainer
					}
					onClick={async () => {
						if (
							typeof selectedRoomId === "number" &&
							typeof selectedContainerId === "number"
						) {
							try {
								await q.cargoControl.containerSummon.netSend({
									roomId: selectedRoomId,
									containerId: selectedContainerId,
									shipId,
								});
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error sending container",
										body: err.message,
										color: "error",
									});
								}
							}
						}
					}}
				>
					Send Container{selectedRoom?.name ? ` to ${selectedRoom?.name}` : ""}
				</Button>
			</div>
		</div>
	);
}
