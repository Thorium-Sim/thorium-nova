import Menubar, { useMenubar } from "@thorium/ui/Menubar";
import { useRef, useState } from "react";
import { AddCoreCombobox } from "./AddCoreCombobox";
import { CoreFlexLayout } from "./CoreFlexLayout";
import { ErrorBoundary } from "react-error-boundary";
import { CoreFlexLayoutProvider } from "./CoreFlexLayoutContext";
import { CoreFlexLayoutDropdown } from "./CoreFlexLayoutDropdown";
import { capitalCase } from "change-case";
import { Icon } from "@thorium/ui/Icon";
import type { Layout } from "@thorium/utils/FlexLayout";
import "@thorium/utils/FlexLayout/dark.css";
import { StationData } from "@thorium/routes/station/useStation";
import { clientId, q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import {
	ComboBox,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
	Button as RAButton,
} from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
export default function FlightDirectorLayout() {
	const layoutRef = useRef<Layout>(null);
	return (
		<StationData>
			<CoreFlexLayoutProvider>
				<div className="h-full flex flex-col backdrop-blur">
					<Menubar>
						<div className="relative flex-1">
							<CoreMenubar layoutRef={layoutRef} />
							<CoreFlexLayout ref={layoutRef} />
						</div>
					</Menubar>
				</div>
			</CoreFlexLayoutProvider>
		</StationData>
	);
}

function CoreMenubar({
	layoutRef,
}: {
	layoutRef: React.RefObject<Layout | null>;
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
				<div className="flex-1" />
				<ShipSelector />
				<Button className="btn-info btn-outline btn-xs">
					<Icon name="plus" />
				</Button>
			</>
		),
	});
	return null;
}

function ShipSelector() {
	const [playerShips] = q.ship.players.useNetRequest();
	const [ship] = q.ship.get.useNetRequest({ clientId });

	const id = ship?.id;
	const name = ship?.name;
	return (
		<ComboBox
			aria-label="ship"
			selectedKey={id}
			onSelectionChange={(shipId) =>
				q.client.setStation.netSend({
					clientId,
					shipId: shipId as number,
					stationId: "Flight Director",
				})
			}
		>
			<div className="cursor-pointer min-h-6 h-6 leading-5 relative border-info border rounded-lg">
				<Input
					placeholder={name}
					className="w-full bg-transparent placeholder:text-info placeholder:font-semibold text-info border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5"
				/>
				<RAButton className="absolute w-10 bg-info/20 hover:bg-info/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
					<Icon
						name="chevrons-up-down"
						className="w-5 h-5 text-success"
						aria-hidden="true"
					/>
				</RAButton>
			</div>
			<Popover className={popoverTransitionClasses}>
				<ListBox
					className="w-full overflow-auto text-base bg-gray-900/90 border-gray-400 border rounded-md shadow-lg max-h-60 ring-1 ring-black/5 focus:outline-none sm:text-sm"
					items={playerShips}
				>
					{(item) => (
						<ListBoxItem className="font-normal truncate cursor-default select-none py-1 px-2 data-[focused]:bg-info text-white">
							{item.name}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}
