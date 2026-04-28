import { clientId, q } from "@thorium/context/AppContext";
import { pickStarmapShip } from "@thorium/cores/StarmapCore/pickShip";
import { StationData } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import Menubar, { useMenubar } from "@thorium/ui/Menubar";
import { cn } from "@thorium/utils/cn";
import type { Layout } from "@thorium/utils/FlexLayout";
import { capitalCase } from "change-case";

import "@thorium/utils/FlexLayout/dark.css";
import { startTransition, useRef, useState } from "react";
import {
	ComboBox,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
	Button as RAButton,
} from "react-aria-components";
import { ErrorBoundary } from "react-error-boundary";

import { AddCoreCombobox } from "./AddCoreCombobox";
import { CoreFlexLayout } from "./CoreFlexLayout";
import { CoreFlexLayoutProvider } from "./CoreFlexLayoutContext";
import { CoreFlexLayoutDropdown } from "./CoreFlexLayoutDropdown";
export default function FlightDirectorLayout() {
	const layoutRef = useRef<Layout>(null);
	const [focusShipId, setFocusShipId] = useState<number>();
	return (
		<StationData shipId={focusShipId}>
			<CoreFlexLayoutProvider>
				<div className="relative flex h-full flex-col backdrop-blur">
					<Menubar>
						<div className="relative flex-1">
							<CoreMenubar
								layoutRef={layoutRef}
								focusShipId={focusShipId}
								setFocusShipId={setFocusShipId}
							/>
							<CoreFlexLayout ref={layoutRef} />
							<div
								className={cn(
									"absolute inset-0 shadow-[inset_0px_0px_20px_var(--color-warning)] pointer-events-none transition-opacity",
									{ "opacity-0": !focusShipId },
								)}
							/>
						</div>
					</Menubar>
				</div>
			</CoreFlexLayoutProvider>
		</StationData>
	);
}

function CoreMenubar({
	layoutRef,
	focusShipId,
	setFocusShipId,
}: {
	layoutRef: React.RefObject<Layout | null>;
	focusShipId: number | undefined;
	setFocusShipId: (value: number | undefined) => void;
}) {
	useMenubar({
		backTo: "/flight/lobby",
		children: (
			<>
				<AddCoreCombobox
					onChange={(coreName) => {
						if (coreName) {
							layoutRef.current?.addTabToActiveTabSet?.({
								component: coreName,
								name: capitalCase(coreName.replace("Core", "")),
							});
						}
					}}
				/>
				<ErrorBoundary fallback={null}>
					<CoreFlexLayoutDropdown />
				</ErrorBoundary>
				<ShipSelector focusShipId={focusShipId} setFocusShipId={setFocusShipId} />
				<Button className="btn-info btn-outline btn-xs" title="Add New Player Ship">
					<Icon name="plus" />
				</Button>
				<Button
					className={cn("btn-warning btn-outline btn-xs", {
						"btn-active": focusShipId,
					})}
					title="Pick Focus Ship"
					onClick={() => {
						if (focusShipId) {
							setFocusShipId(undefined);
							return;
						}
						pickStarmapShip("Choose a ship to transfer core control to.", (object) =>
							startTransition(() => {
								setFocusShipId(object);
							}),
						);
					}}
				>
					<Icon name="scan" />
				</Button>
			</>
		),
	});
	return null;
}

function ShipSelector({
	focusShipId,
	setFocusShipId,
}: {
	focusShipId: number | undefined;
	setFocusShipId: (value: number | undefined) => void;
}) {
	const [playerShips] = q.ship.players.useNetRequest();
	const [ship] = q.ship.get.useNetRequest({ clientId });
	const [focusShip] = q.ship.player.useNetRequest({
		shipId: focusShipId || -1,
	});

	const id = ship?.id;
	const name = ship?.name;

	const shipList = playerShips.map((p) => ({ id: p.id, name: p.name }));
	if (focusShipId) {
		shipList.push({
			id: focusShipId,
			name: focusShip.id === focusShipId ? focusShip.name : `Entity ${focusShipId}`,
		});
	}
	return (
		<ComboBox
			aria-label="ship"
			selectedKey={focusShipId || id}
			onSelectionChange={(shipId) => {
				q.client.setStation.netSend({
					clientId,
					shipId: shipId as number,
					stationId: "Flight Director",
				});
				setFocusShipId(undefined);
			}}
		>
			<div className="border-info relative h-6 min-h-6 cursor-pointer rounded-lg border leading-5">
				<Input
					placeholder={name || "Choose Player Ship"}
					className="placeholder:text-info text-info w-full border-none bg-transparent pr-10 pl-3 text-xs leading-5 outline-none placeholder:font-semibold focus:ring-0"
				/>
				<RAButton className="bg-info/20 hover:bg-info/50 absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded">
					<Icon name="chevrons-up-down" className="text-success h-5 w-5" aria-hidden="true" />
				</RAButton>
			</div>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					className="max-h-60 w-full overflow-auto rounded-md border border-gray-400 bg-gray-900/90 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
					items={shipList}
				>
					{(item) => (
						<ListBoxItem className="data-focused:bg-info cursor-default truncate px-2 py-1 font-normal text-white select-none">
							{item.name}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}
