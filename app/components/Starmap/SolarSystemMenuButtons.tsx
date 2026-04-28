import { q } from "@thorium/context/AppContext";
import { useConfirm } from "@thorium/ui/AlertDialog";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Icon } from "@thorium/ui/Icon";
import { planetTypes } from "@thorium/utils/flags/planetTypes";
import { starTypes } from "@thorium/utils/flags/starTypes";
import { Menu, MenuItem, MenuTrigger, Popover, Button as RAButton } from "react-aria-components";

import Button from "../ui/Button";
import { useGetStarmapStore } from "./starmapStore";
import { useSystemIds } from "./useSystemIds";

export function SolarSystemMenuButtons() {
	const [pluginId, solarSystemId] = useSystemIds();
	const useStarmapStore = useGetStarmapStore();

	const selectedObjectIds = useStarmapStore((s) => s.selectedObjectIds);
	const cameraView = useStarmapStore((s) => s.cameraView);
	const confirm = useConfirm();

	async function deleteObject() {
		const selectedObjectIds = useStarmapStore.getState().selectedObjectIds;
		if (selectedObjectIds.length === 0) return;

		const doRemove = await confirm({
			header: "Are you sure you want to remove this object?",
			body: "It will remove all of the objects inside of it.",
		});
		if (!doRemove) return;

		if (typeof selectedObjectIds === "string") {
			await q.plugin.starmap.star.delete.netSend({
				pluginId,
				solarSystemId,
				starId: selectedObjectIds,
			});
		} else {
			// TODO: Delete objects from the flight director menubar? Maybe not...
		}

		useStarmapStore.setState({
			selectedObjectIds: [],
		});
	}

	return (
		<>
			<Button
				className="btn-info btn-outline btn-xs"
				onClick={() => useStarmapStore.setState({ selectedObjectIds: [solarSystemId] })}
			>
				Edit System
			</Button>
			<AddStarMenu />
			<AddPlanetMenu />

			<Button
				className="btn-error btn-outline btn-xs"
				disabled={!selectedObjectIds}
				onClick={deleteObject}
			>
				Delete
			</Button>
			<Button
				className="btn-notice btn-outline btn-xs"
				onClick={() => useStarmapStore.getState().setCameraView(cameraView === "2d" ? "3d" : "2d")}
			>
				Go to {cameraView === "2d" ? "3D" : "2D"}
			</Button>
		</>
	);
}

function AddStarMenu() {
	const [pluginId, solarSystemId] = useSystemIds();
	const useStarmapStore = useGetStarmapStore();

	return (
		<MenuTrigger>
			<RAButton className="btn btn-error btn-outline btn-xs">
				Add Star
				<Icon name="chevron-down" className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
			</RAButton>
			<Popover className={popoverTransitionClasses}>
				<Menu className="mt-2 w-56 origin-top-right divide-y divide-gray-800 rounded-md bg-gray-900 shadow-lg ring-1 ring-white/5 focus:outline-none">
					{starTypes.map((starType) => (
						<MenuItem
							key={starType.spectralType}
							className={({ isFocused }) =>
								`${
									isFocused ? "bg-violet-900 text-white" : "text-gray-200"
								} group flex w-full items-center px-2 py-2 text-sm`
							}
							onAction={async () => {
								const result = await q.plugin.starmap.star.create.netSend({
									pluginId,
									solarSystemId,
									spectralType: starType.spectralType,
								});
								useStarmapStore.setState({
									selectedObjectIds: [result.name],
								});
							}}
						>
							{starType.spectralType} - {starType.name} (
							{Math.round(starType.prevalence * 1000) / 10}% Common)
						</MenuItem>
					))}
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}

function AddPlanetMenu() {
	const [pluginId, solarSystemId] = useSystemIds();
	const useStarmapStore = useGetStarmapStore();

	return (
		<MenuTrigger>
			<div>
				<RAButton className="btn btn-primary btn-outline btn-xs">
					Add Planet
					<Icon name="chevron-down" className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
				</RAButton>
			</div>
			<Popover className={popoverTransitionClasses}>
				<Menu className="mt-2 w-56 origin-top-right divide-y divide-gray-800 rounded-md bg-gray-900 shadow-lg ring-1 ring-white/5 focus:outline-none">
					{planetTypes.map((planetType) => (
						<MenuItem
							key={planetType.classification}
							className={({ isFocused }) =>
								`${
									isFocused ? "bg-violet-900 text-white" : "text-gray-200"
								} group flex w-full items-center px-2 py-2 text-sm`
							}
							onAction={async () => {
								const result = await q.plugin.starmap.planet.create.netSend({
									pluginId,
									solarSystemId,
									planetType: planetType.classification,
								});
								useStarmapStore.setState({
									selectedObjectIds: [result.name],
								});
							}}
						>
							{planetType.classification} - {planetType.name}
						</MenuItem>
					))}
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}
