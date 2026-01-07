import * as React from "react";
import { Suspense } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useExternalCameraControl } from "./CameraControls";
import { useGetStarmapStore } from "./starmapStore";
import CameraControlsClass from "camera-controls";
import {
	astronomicalUnitToKilometer,
	type Kilometer,
	solarRadiusToKilometers,
} from "@thorium/utils/unitTypes";
import { Box3, type Camera, Vector3 } from "three";
import Button from "../ui/Button";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Disc from "./Disc";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { BasicDisclosure } from "./EditorPalettes/BasicDisclosure";
import { PlanetDisclosure } from "./EditorPalettes/PlanetDisclosure";
import { OrbitDisclosure } from "./EditorPalettes/OrbitDisclosure";
import { PlanetAssetDisclosure } from "./EditorPalettes/PlanetAssetDisclosure";
import type StarPlugin from "@thorium/.server/classes/Plugins/Universe/Star";
import { Grid, PolarGrid } from "./PolarGrid";
import { useSystemIds } from "./useSystemIds";
import Input from "@thorium/ui/Input";
import Checkbox from "@thorium/ui/Checkbox";
import { useParams } from "react-router";
import { q } from "@thorium/context/AppContext";
import type PlanetPlugin from "@thorium/.server/classes/Plugins/Universe/Planet";
import type SolarSystemPlugin from "@thorium/.server/classes/Plugins/Universe/SolarSystem";
import { Icon } from "@thorium/ui/Icon";
import { starTypes } from "@thorium/utils/flags/starTypes";
import { planetTypes } from "@thorium/utils/flags/planetTypes";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { CameraControls } from "@react-three/drei";
import {
	Disclosure,
	DisclosurePanel,
	Heading,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
	Button as RAButton,
} from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";

const ACTION = CameraControlsClass.ACTION;

// 10% further than Neptune's orbit
export const SOLAR_SYSTEM_MAX_DISTANCE: Kilometer = 4_000_000_000 * 1.1;

function HabitableZone({ systemId }: { systemId: string }) {
	const [pluginId, solarSystemId] = useSystemIds();
	const [system] = q.plugin.starmap.get.useNetRequest({
		pluginId,
		solarSystemId: solarSystemId || systemId,
	});
	const scaleUnit = astronomicalUnitToKilometer(1);
	if (!system) return null;
	const { habitableZoneInner = 0, habitableZoneOuter = 3, stars } = system;
	return stars.length > 0 ? (
		<Disc
			habitableZoneInner={habitableZoneInner}
			habitableZoneOuter={habitableZoneOuter}
			scale={[scaleUnit, scaleUnit, scaleUnit]}
		/>
	) : null;
}

const vec = new Vector3();
export function SolarSystemMap({
	systemId,
	skyboxKey = "Basic",
	children,
	minDistance = 1,
	maxDistance = SOLAR_SYSTEM_MAX_DISTANCE,
}: {
	systemId?: string;
	skyboxKey: string;
	children?: React.ReactNode;
	minDistance?: number;
	maxDistance?: number;
}) {
	const pluginId = useParams().pluginId;
	const useStarmapStore = useGetStarmapStore();

	const { camera } = useThree();
	const controlsEnabled = useStarmapStore((s) => s.cameraControlsEnabled);
	const cameraView = useStarmapStore((s) => s.cameraView);
	const orbitControls = React.useRef<CameraControlsClass>(null);

	useEffect(() => {
		useStarmapStore.setState({ skyboxKey: skyboxKey || "blank" });
	}, [skyboxKey, useStarmapStore]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to update when the camera changes
	useEffect(() => {
		// Set the initial camera position
		orbitControls.current?.setPosition(0, 50_000, 0);
		const max = SOLAR_SYSTEM_MAX_DISTANCE * 0.75;
		orbitControls.current?.setBoundary(
			new Box3(new Vector3(-max, -max, -max), new Vector3(max, max, max)),
		);
		useStarmapStore.getState().setCameraControlsEnabled(true);
	}, [camera, useStarmapStore]);

	useEffect(() => {
		if (cameraView === "2d") {
			orbitControls.current?.rotatePolarTo(0, true);
			orbitControls.current?.rotateAzimuthTo(0, true);
		}
	}, [cameraView]);

	useExternalCameraControl(orbitControls);
	const viewingMode = useStarmapStore((store) => store.viewingMode);

	const isViewscreen = viewingMode === "viewscreen";
	return (
		<Suspense fallback={null}>
			{!pluginId || !systemId ? null : <HabitableZone systemId={systemId} />}
			{!isViewscreen && (
				<>
					<CameraControls
						ref={orbitControls}
						enabled={controlsEnabled}
						maxDistance={maxDistance}
						minDistance={minDistance}
						mouseButtons={{
							left: ACTION.TRUCK,
							right: ACTION.ROTATE,
							middle: ACTION.DOLLY,
							wheel: ACTION.DOLLY,
						}}
						dollyToCursor={false}
						dollySpeed={0.5}
					/>
					<PolarGrid
						rotation={[0, (2 * Math.PI) / 12, 0]}
						args={[maxDistance, 12, 20, 64, 0xffffff, 0xffffff]}
					/>
					{/* Adjust opacity as the camera zooms in. */}
					{/* <Grid args={[CELLS * SECTOR_GRID_SIZE, CELLS, 0xffffff, 0xffffff]} /> */}
				</>
			)}
			{children}
		</Suspense>
	);
}

interface SceneRef {
	camera: () => Camera;
}

export function SolarSystemMenuButtons({
	sceneRef,
}: {
	sceneRef: React.MutableRefObject<SceneRef | undefined>;
}) {
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
				onClick={() =>
					useStarmapStore.setState({ selectedObjectIds: [solarSystemId] })
				}
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
				onClick={() =>
					useStarmapStore
						.getState()
						.setCameraView(cameraView === "2d" ? "3d" : "2d")
				}
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
				<Icon
					name="chevron-down"
					className="w-5 h-5 ml-2 -mr-1"
					aria-hidden="true"
				/>
			</RAButton>
			<Popover className={popoverTransitionClasses}>
				<Menu className="w-56 mt-2 origin-top-right bg-gray-900 divide-y divide-gray-800 rounded-md shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none">
					{starTypes.map((starType) => (
						<MenuItem
							key={starType.spectralType}
							className={({ isFocused }) =>
								`${
									isFocused ? "bg-violet-900 text-white" : "text-gray-200"
								} group flex items-center w-full px-2 py-2 text-sm`
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
					<Icon
						name="chevron-down"
						className="w-5 h-5 ml-2 -mr-1"
						aria-hidden="true"
					/>
				</RAButton>
			</div>
			<Popover className={popoverTransitionClasses}>
				<Menu className="w-56 mt-2 origin-top-right bg-gray-900 divide-y divide-gray-800 rounded-md shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none">
					{planetTypes.map((planetType) => (
						<MenuItem
							key={planetType.classification}
							className={({ isFocused }) =>
								`${
									isFocused ? "bg-violet-900 text-white" : "text-gray-200"
								} group flex items-center w-full px-2 py-2 text-sm`
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

const HandleIsOpen = ({
	open,
	title,
	scrollRef,
}: {
	title: string;
	open: boolean;
	scrollRef: React.RefObject<HTMLDivElement | null>;
}) => {
	const hasMounted = React.useRef(false);
	useEffect(() => {
		localStorage.setItem(`editor-palette-open-${title}`, JSON.stringify(open));
	}, [title, open]);
	React.useLayoutEffect(() => {
		if (open && hasMounted.current) {
			setTimeout(() => {
				scrollRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
		}
		hasMounted.current = true;
	}, [open, scrollRef]);

	return null;
};
export function PaletteDisclosure({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [isDefaultOpen] = useLocalStorage(
		`editor-palette-open-${title}`,
		defaultOpen,
	);
	const disclosureRef = React.useRef<HTMLDivElement>(null);
	return (
		<Disclosure defaultExpanded={isDefaultOpen}>
			{({ isExpanded }) => (
				<>
					<HandleIsOpen
						open={isExpanded}
						title={title}
						scrollRef={disclosureRef}
					/>
					<Heading
						className="w-full py-1 px-2 bg-gray-900 sticky -top-1"
						ref={disclosureRef}
					>
						<RAButton className="btn btn-notice btn-sm justify-between btn-block">
							<span>{title}</span>
							<Icon
								name="chevron-up"
								className={` transition-transform${
									isExpanded ? "transform rotate-180" : ""
								} w-5 h-5`}
							/>
						</RAButton>
					</Heading>

					<DisclosurePanel className="pt-4 pb-2 px-2 border-b border-b-gray-700">
						{children}
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}

function useSelectedObject() {
	const useStarmapStore = useGetStarmapStore();

	const [pluginId, solarSystemId] = useSystemIds();
	const selectedObjectIds = useStarmapStore((state) => state.selectedObjectIds);
	const [systemData] = q.plugin.starmap.get.useNetRequest({
		pluginId,
		solarSystemId,
	});

	// It could be a system, star, or planet
	if (selectedObjectIds.includes(solarSystemId)) {
		return { type: "system" as const, object: systemData };
	}

	const star = systemData?.stars.find((star) =>
		selectedObjectIds.includes(star.name),
	);
	if (star) {
		return { type: "star" as const, object: star };
	}

	const planet = systemData?.planets.find((planet) =>
		selectedObjectIds.includes(planet.name),
	);
	if (planet) {
		return { type: "planet" as const, object: planet };
	}

	return null;
}
export function SolarSystemPalette() {
	const results = useSelectedObject();
	if (!results || !results.object) return null;
	return (
		<div
			className="w-full h-full overflow-y-auto overflow-x-hidden text-white"
			key={results.object.name}
		>
			<ZoomToObject object={results.object} />
			<BasicDisclosure object={results.object} type={results.type} />
			{results.type === "planet" && (
				<>
					<PlanetDisclosure object={results.object} />
					<PlanetAssetDisclosure object={results.object} />
					<OrbitDisclosure object={results.object} />
				</>
			)}
			{results.type === "star" && <StarDisclosure object={results.object} />}
		</div>
	);
}

function ZoomToObject({
	object,
}: {
	object: StarPlugin | PlanetPlugin | SolarSystemPlugin;
}) {
	const useStarmapStore = useGetStarmapStore();

	if (!("satellite" in object)) {
		return null;
	}

	return (
		<Button
			className="btn-block btn-xs"
			onClick={() => {
				const position = getOrbitPosition(object.satellite);
				let radius = 0;
				if ("isPlanet" in object) {
					radius = object.isPlanet.radius;
				} else {
					radius = solarRadiusToKilometers(object.radius);
				}

				const box = new Box3(
					new Vector3(
						position.x - radius,
						position.y - radius,
						position.z - radius,
					),
					new Vector3(
						position.x + radius,
						position.y + radius,
						position.z + radius,
					),
				);
				useStarmapStore.getState().cameraControls?.current?.fitToBox(box, true);
			}}
		>
			Zoom to Object
		</Button>
	);
}

function StarDisclosure({ object }: { object: StarPlugin }) {
	const [pluginId, solarSystemId] = useSystemIds();

	return (
		<PaletteDisclosure title="Star">
			<Input
				label="Spectral Type"
				helperText="Cannot be changed"
				type="text"
				readOnly
				defaultValue={object.spectralType}
			/>
			<Input
				label="Solar Mass"
				helperText="The mass of the star compared to the Sun"
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.solarMass}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						solarMass: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Age"
				helperText="The age of the star in years"
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.age}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						age: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Radius"
				helperText="The radius of the star compared to the radius of the sun."
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.radius}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						radius: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Temperature"
				helperText="The temperature of the star in Kelvin."
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.temperature}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						temperature: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Hue"
				helperText="The hue of the star"
				type="range"
				min={0}
				max={360}
				step={1}
				defaultValue={object.hue}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						hue: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Checkbox
				label="White Star"
				helperText="If checked, the star will be white. Overrides hue."
				defaultChecked={object.isWhite}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						isWhite: e.target.checked,
					});
				}}
			/>
		</PaletteDisclosure>
	);
}
