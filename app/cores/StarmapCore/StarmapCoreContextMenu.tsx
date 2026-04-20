import { autoPlacement, useFloating } from "@floating-ui/react";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { toast } from "@thorium/context/ToastContext";
import useEventListener from "@thorium/hooks/useEventListener";
import { useRightClick } from "@thorium/hooks/useRightClick";
import { type RefObject, useState } from "react";
import { q } from "@thorium/context/AppContext";
import { Portal } from "@thorium/ui/Portal";
import { pickStarmapShip } from "@thorium/cores/StarmapCore/pickShip";

function makeVirtualEl({ x: X, y: Y }: { x: number; y: number }) {
	const virtualEl = {
		getBoundingClientRect() {
			return {
				width: 0,
				height: 0,
				x: X,
				y: Y,
				top: Y,
				left: X,
				right: X,
				bottom: Y,
			};
		},
	};
	return virtualEl;
}

const menuItemClass =
	"px-1 py-0.5 text-left cursor-pointer hover:bg-purple-700/50 focus:outline-none focus:ring transition-all";

export const StarmapCoreContextMenu = ({
	parentRef,
}: {
	parentRef: RefObject<HTMLDivElement | null>;
}) => {
	const [open, setOpen] = useState<
		| {
				x: number;
				y: number;
				object?: { type: "star" | "ship" | "planet"; id: number };
		  }
		| false
	>(false);
	const useStarmapStore = useGetStarmapStore();

	const { strategy, refs } = useFloating({
		open: !!open,
		onOpenChange: (open) => setOpen(open ? { x: 0, y: 0 } : false),
		placement: "right-start",
		middleware: [autoPlacement()],
	});

	useEventListener("pointerdown", (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (refs.floating.current === target.parentElement) return;
		setOpen(false);
	});

	useRightClick((e) => {
		e.preventDefault();

		const object = useStarmapStore
			.getState()
			.getObjectsUnderCursor?.()
			.filter(
				(o) => o.userData.type && o.userData.id !== undefined,
			)[0]?.userData;

		setOpen({ x: e.clientX, y: e.clientY, object });
		const virtualEl = makeVirtualEl({ x: e.clientX, y: e.clientY });
		refs.setReference(virtualEl);
	}, parentRef);

	useEventListener("wheel", () => {
		setOpen(false);
	});

	useEventListener("starmap-zoom", () => {
		setOpen(false);
	});

	const selectedShips = useStarmapStore.getState().selectedObjectIds;

	if (!open) return null;

	const { x, y, object } = open;

	return (
		<Portal>
			<div
				ref={refs.setFloating}
				style={{
					position: strategy,
					top: y ?? "",
					left: x ?? "",
				}}
				className="text-white bg-black/50 border border-white/25 text-xs rounded-sm divide-y divide-purple-500/25 flex flex-col"
			>
				{/* TODO March 11, 2024: Add commands for when right clicking on another object, such as following or attacking the target */}
				{selectedShips.length > 0 ? (
					!object ? (
						<>
							<button
								className={menuItemClass}
								onClick={() => {
									if (selectedShips.length > 0) {
										const position = useStarmapStore
											.getState()
											.translate2DTo3D?.(x, y);
										if (!position) return;

										q.starmapCore.setDestinations.netSend({
											ships: selectedShips.map((id: any) => ({
												id,
												position: {
													x: position.x,
													y: useStarmapStore.getState().yDimensionIndex,
													z: position.z,
												},
												systemId: useStarmapStore.getState().currentSystem,
											})),
										});
										setOpen(false);
									}
								}}
							>
								Travel To Here
							</button>
							<button
								className={menuItemClass}
								onClick={() => {
									if (selectedShips.length > 0) {
										const position = useStarmapStore
											.getState()
											.translate2DTo3D?.(x, y);
										if (!position) return;
										q.starmapCore.fireTorpedo.netSend({
											objectId: selectedShips[0] as number,
											position: {
												x: position.x,
												y: useStarmapStore.getState().yDimensionIndex,
												z: position.z,
												parentId: useStarmapStore.getState().currentSystem!,
											},
										});
										setOpen(false);
									}
								}}
							>
								Spawn Torpedo (Debug)
							</button>
						</>
					) : object.type === "planet" ? (
						<button
							className={menuItemClass}
							onClick={() => {
								if (selectedShips.length > 0) {
									q.starmapCore.setOrbit.netSend({
										ships: useStarmapStore.getState()
											.selectedObjectIds as number[],
										objectId: object.id,
									});
									setOpen(false);
								}
							}}
						>
							Orbit Planet
						</button>
					) : object.type === "star" ? (
						<button
							className={menuItemClass}
							onClick={() => {
								if (selectedShips.length > 0) {
									q.starmapCore.setOrbit.netSend({
										ships: useStarmapStore.getState()
											.selectedObjectIds as number[],
										objectId: object.id,
									});
									setOpen(false);
								}
							}}
						>
							Orbit Star
						</button>
					) : object.type === "ship" ? (
						<button
							className={menuItemClass}
							onClick={() => {
								if (selectedShips.length > 0) {
									q.starmapCore.setFollowShip.netSend({
										ships: useStarmapStore.getState()
											.selectedObjectIds as number[],
										objectId: object.id,
										// TODO: March 15, 2024 - This should change based on the current objective of the ship
										objective: "defend",
									});
									setOpen(false);
								}
							}}
						>
							Follow Ship
						</button>
					) : null
				) : null}
				{object ? (
					<>
						<button
							className={menuItemClass}
							onClick={async () => {
								if (!object) return;
								const objectId = object.id;
								const objectDetails = await q.starmapCore.object.netRequest({
									objectId,
								});
								pickStarmapShip(
									`Choose a ship to hail ${objectDetails?.components.identity?.name || "this object."}`,
									(picked) => {
										q.shortRangeComm.hail.netSend({
											shipId: picked,
											targetId: objectId,
										});
									},
								);
							}}
						>
							Hail to...
						</button>
						<button
							className={menuItemClass}
							onClick={async () => {
								if (!object) return;
								const objectId = object.id;
								const objectDetails = await q.starmapCore.object.netRequest({
									objectId,
								});
								pickStarmapShip(
									`Choose a ship for ${objectDetails?.components.identity?.name || "this object"} to hail.`,
									(picked) => {
										q.shortRangeComm.hail.netSend({
											targetId: picked,
											shipId: objectId,
										});
									},
								);
							}}
						>
							Hail from...
						</button>
					</>
				) : null}
				<button
					className={menuItemClass}
					onClick={async () => {
						const template = useStarmapStore.getState().spawnShipTemplate;
						if (!template) {
							toast({
								title: "Cannot Spawn Ship",
								body: "Please choose a template to spawn from the menubar.",
								color: "error",
							});
							setOpen(false);
							return;
						}
						if (typeof x !== "number" || typeof y !== "number") return;

						const position = useStarmapStore.getState().translate2DTo3D?.(x, y);
						if (!position) return;

						await q.ship.spawn.netSend({
							template: { name: template.name, pluginId: template.pluginName },
							position: {
								x: position.x,
								y: useStarmapStore.getState().yDimensionIndex,
								z: position.z,
								parentId: useStarmapStore.getState().currentSystem,
							},
						});
						setOpen(false);
					}}
				>
					Spawn Here
				</button>
				<button className={menuItemClass}>Measure Distance</button>
			</div>
		</Portal>
	);
};
