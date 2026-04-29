import type { CardProps } from "@thorium/cards/CardProps";

import "./style.css";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { pixelRatio } from "@thorium/utils/pixelRatio.client";

import { CargoContainerDot } from "./CargoContainerDot";
import { CargoContainerList } from "./CargoContainerList";
import { CargoList } from "./CargoList";
import { CargoSearchInput } from "./CargoSearchInput";
import { ContainerLabel } from "./ContainerLabel";
import { DeckPicker } from "./DeckPicker";
import { GoToRoomButton } from "./GoToRoomButton";
import { RoomDot } from "./RoomDot";
import { ShipView } from "./ShipView";
import { useShipMapStore } from "./useShipMapStore";
import { useTransferAmount } from "./useTransferAmount";

export function CargoControl(props: CardProps) {
	const { shipId } = useStation();
	const selectedRoomId = useShipMapStore((state) => state.selectedRoomId);
	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);
	const deckIndex = useShipMapStore((state) => state.deckIndex);

	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });
	const [cargoContainers] = q.cargoControl.containers.useNetRequest({ shipId });
	q.cargoControl.stream.useDataStream({ shipId });
	const { rooms, decks } = cargoRooms;

	const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
	const selectedContainer = cargoContainers.find((c) => c.id === selectedContainerId);

	const enRouteContainer = cargoContainers.find(
		(container) => selectedRoomId && container.destinationNode === selectedRoomId,
	);

	const transferAmount = useTransferAmount();
	const maxDeckName = Math.max(...decks.map((d) => d.name.length));
	return (
		<div
			className="relative mx-auto grid h-full grid-rows-2 gap-8"
			style={{
				gridTemplateColumns: `calc(${maxDeckName}ch + 1.25rem) 1fr 30% 50px`,
			}}
		>
			<DeckPicker decks={decks} />
			<div className="row-span-2">
				<div className="z-10 mx-auto w-1/3">
					<CargoSearchInput />
				</div>
				<ShipView
					deckIndex={deckIndex}
					cardLoaded={props.cardLoaded}
					deckChildren={(deck, deckIndex) => (
						<CargoContainerDeckChildren key={deckIndex} deck={deck} deckIndex={deckIndex} />
					)}
				/>
			</div>
			<div className="flex h-full flex-col">
				<h3 className="text-xl">
					{selectedRoom ? (
						<span className="flex justify-between">
							<span>
								{selectedRoom.name} ({selectedRoom.used} / {selectedRoom.volume})
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
					enRouteContainer={enRouteContainer}
					selectedContainerId={selectedContainerId}
					onClick={async (key: string) => {
						if (
							selectedRoom?.id &&
							enRouteContainer?.id === selectedContainerId &&
							enRouteContainer?.entityState === "idle"
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
				<div className="flex h-10 w-full items-center justify-center">
					{enRouteContainer?.entityState === "enRoute" ? (
						<Button className="btn-disabled w-full" disabled>
							{enRouteContainer.name} En Route
						</Button>
					) : enRouteContainer?.entityState === "idle" &&
					  enRouteContainer.id === selectedContainerId ? (
						<p>Click cargo line to transfer {transferAmount} item</p>
					) : (
						<Button
							className={`w-full ${!selectedRoomId ? "btn-disabled" : "btn-primary"}`}
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
			<div className="flex h-full flex-col">
				<ContainerLabel />
				<CargoList
					selectedRoom={selectedContainer}
					enRouteContainer={enRouteContainer}
					selectedContainerId={selectedContainerId}
					onClick={async (key) => {
						if (
							enRouteContainer?.id === selectedContainerId &&
							selectedRoom &&
							enRouteContainer.entityState === "idle"
						) {
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
						if (typeof selectedRoomId === "number" && typeof selectedContainerId === "number") {
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

function CargoContainerDeckChildren({
	deck,
	deckIndex,
}: {
	deck: { name: string };
	deckIndex: number;
}) {
	const { shipId } = useStation();
	const [cargoRooms] = q.cargoControl.rooms.useNetRequest({ shipId });
	const transform = useShipMapStore((store) => store.transform);
	const { rooms } = cargoRooms;
	const [cargoContainers] = q.cargoControl.containers.useNetRequest({ shipId });

	return (
		<>
			{rooms.map((room) =>
				room.deck === deck.name ? (
					<RoomDot
						key={room.id}
						id={room.id}
						name={room.name || ""}
						position={{
							x: room.position.x * pixelRatio * transform.widthScale,
							y: room.position.y * pixelRatio * transform.widthScale,
						}}
					/>
				) : null,
			)}
			{cargoContainers.map(
				(container) =>
					container.position && (
						<CargoContainerDot
							key={container.id}
							id={container.id}
							position={container.position}
							widthScale={transform.widthScale}
							deckIndex={deckIndex}
						/>
					),
			)}
		</>
	);
}
