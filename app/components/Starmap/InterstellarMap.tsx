import * as React from "react";
import { useParams } from "react-router";
import { useThree } from "@react-three/fiber";
import { useRef, Suspense, useEffect } from "react";
import { Box3, type Camera, Vector3 } from "three";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";

import Starfield from "@thorium/components/Starmap/Starfield";
import {
	type LightMinute,
	lightMinuteToLightYear,
	type LightYear,
	lightYearToLightMinute,
} from "@thorium/utils/unitTypes";
import { toast } from "@thorium/context/ToastContext";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useExternalCameraControl } from "./CameraControls";
import CameraControlsClass from "camera-controls";
import debounce from "lodash.debounce";
import Input from "@thorium/ui/Input";
import { PolarGrid } from "./PolarGrid";
import { q } from "@thorium/context/AppContext";
import { CameraControls } from "@react-three/drei";
import Checkbox from "@thorium/ui/Checkbox";

const ACTION = CameraControlsClass.ACTION;

export const INTERSTELLAR_MAX_DISTANCE: LightYear = 2000;

export function InterstellarMap({ children }: { children: React.ReactNode }) {
	const useStarmapStore = useGetStarmapStore();
	const controlsEnabled = useStarmapStore((s) => s.cameraControlsEnabled);
	const cameraView = useStarmapStore((s) => s.cameraView);
	const orbitControls = useRef<CameraControlsClass>(null);
	const { camera } = useThree();
	camera.userData.id = "interstellar-camera";

	useEffect(() => {
		// Set the initial camera position
		orbitControls.current?.setPosition(
			0,
			lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE) / 2,
			0,
		);
		const max = lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE) * 0.75;
		orbitControls.current?.setBoundary(
			new Box3(new Vector3(-max, -max, -max), new Vector3(max, max, max)),
		);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Update when the camera changes
	useEffect(() => {
		if (cameraView === "2d") {
			orbitControls.current?.rotatePolarTo(0, true);
			orbitControls.current?.rotateAzimuthTo(0, true);
		}
	}, [camera, cameraView]);

	useEffect(() => {
		useStarmapStore.setState({ skyboxKey: "blank" });
	}, [useStarmapStore]);
	useExternalCameraControl(orbitControls);

	const viewingMode = useStarmapStore((store) => store.viewingMode);

	const isStation = viewingMode === "station";
	const isViewscreen = viewingMode === "viewscreen";

	return (
		<Suspense fallback={null}>
			<Starfield radius={lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)} />
			{!isViewscreen && (
				<>
					<CameraControls
						ref={orbitControls}
						enabled={controlsEnabled}
						maxDistance={lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE)}
						minDistance={1}
						mouseButtons={{
							left: ACTION.TRUCK,
							right: ACTION.ROTATE,
							middle: ACTION.DOLLY,
							wheel: ACTION.DOLLY,
						}}
						dollyToCursor={isStation}
						dollySpeed={0.5}
					/>
					<PolarGrid
						rotation={[0, (2 * Math.PI) / 12, 0]}
						args={[
							lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE),
							12,
							20,
							64,
							0xffffff,
							0xffffff,
						]}
					/>
				</>
			)}
			{children}
		</Suspense>
	);
}

interface SceneRef {
	camera: () => Camera;
}

export function InterstellarMenuButtons({
	sceneRef,
}: {
	sceneRef: React.RefObject<SceneRef | undefined>;
}) {
	const { pluginId } = useParams() as {
		pluginId: string;
	};
	const useStarmapStore = useGetStarmapStore();

	const selectedObjectIds = useStarmapStore((s) => s.selectedObjectIds);
	const cameraView = useStarmapStore((s) => s.cameraView);
	const confirm = useConfirm();
	async function deleteObject() {
		const selectedObjectIds = useStarmapStore.getState().selectedObjectIds;
		if (
			selectedObjectIds.length === 0 ||
			typeof selectedObjectIds[0] === "number"
		)
			return;

		const doRemove = await confirm({
			header: "Are you sure you want to remove this object?",
			body: "It will remove all of the objects inside of it.",
		});
		if (!doRemove) return;

		await q.plugin.starmap.solarSystem.delete.netSend({
			pluginId,
			solarSystemId: selectedObjectIds[0],
		});

		useStarmapStore.setState({
			selectedObjectIds: [],
		});
	}

	return (
		<>
			<Button
				className="btn-success btn-outline btn-xs"
				onClick={async () => {
					const camera = sceneRef.current?.camera();
					if (!camera) return;
					const vec = new Vector3(0, 0, lightYearToLightMinute(-300));

					vec.applyQuaternion(camera.quaternion).add(camera.position);
					try {
						const system = await q.plugin.starmap.solarSystem.create.netSend({
							pluginId,
							position: vec,
						});
						useStarmapStore.setState({
							selectedObjectIds: [system.solarSystemId],
						});
					} catch (err) {
						if (err instanceof Error) {
							toast({
								title: "Error creating system",
								body: err.message,
								color: "error",
							});
							return;
						}
					}
				}}
			>
				Add
			</Button>
			<Button
				className="btn-error btn-outline btn-xs"
				disabled={!selectedObjectIds}
				onClick={deleteObject}
			>
				Delete
			</Button>
			<Button
				className="btn-primary btn-outline btn-xs"
				disabled={!selectedObjectIds}
			>
				Edit
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

export const InterstellarPalette = ({
	selectedStar,
	update,
}: {
	selectedStar: {
		name: string;
		position: Record<"x" | "y" | "z", LightMinute>;
		description: string;
		commSatellite: boolean;
		commSatelliteRadius?: number;
	};
	update: (params: {
		name?: string | undefined;
		description?: string | undefined;
		commSatellite?: boolean;
		commSatelliteRadius?: number;
		position?: { x: number; y: number; z: number };
	}) => Promise<void>;
}) => {
	const useStarmapStore = useGetStarmapStore();

	useEffect(() => {
		if (!selectedStar) {
			useStarmapStore.setState({ selectedObjectIds: [] });
		}
	}, [selectedStar, useStarmapStore]);

	const [name, setName] = React.useState(selectedStar?.name || "");
	const [description, setDescription] = React.useState(
		selectedStar?.description || "",
	);

	const debouncedUpdate = React.useMemo(
		() => debounce(update, 500, { maxWait: 2000, trailing: true }),
		[update],
	);

	useEffect(() => {
		if (!selectedStar) return;
		setName(selectedStar.name);
		setDescription(selectedStar.description);
	}, [selectedStar, selectedStar?.name, selectedStar?.description]);

	return (
		<div
			className="w-full h-full overflow-y-auto p-2 text-white"
			key={selectedStar?.name}
		>
			<Input
				label="Name"
				value={name}
				onChange={(e) => {
					setName(e.target.value);
					debouncedUpdate({ name: e.target.value });
				}}
				name="name"
			/>
			<Input
				label="Description"
				as="textarea"
				rows={5}
				className="resize-none"
				value={description}
				onChange={(e) => {
					setDescription(e.target.value);
					debouncedUpdate({ description: e.target.value });
				}}
				name="description"
			/>
			{/** biome-ignore lint/a11y/noLabelWithoutControl: Multiple inputs for this label */}
			<label>Position</label>
			<div className="flex gap-0.5">
				<input
					className="input flex-1"
					inputMode="numeric"
					pattern="[0-9]*"
					defaultValue={lightMinuteToLightYear(selectedStar.position.x)}
					onChange={(e) => {
						update({
							position: {
								...selectedStar.position,
								x: lightYearToLightMinute(Number(e.currentTarget.value)),
							},
						});
					}}
				></input>
				<input
					className="input flex-1"
					inputMode="numeric"
					pattern="[0-9]*"
					defaultValue={lightMinuteToLightYear(selectedStar.position.y)}
					onChange={(e) => {
						update({
							position: {
								...selectedStar.position,
								y: lightYearToLightMinute(Number(e.currentTarget.value)),
							},
						});
					}}
				></input>
				<input
					className="input flex-1"
					inputMode="numeric"
					pattern="[0-9]*"
					defaultValue={lightMinuteToLightYear(selectedStar.position.z)}
					onChange={(e) => {
						update({
							position: {
								...selectedStar.position,
								z: lightYearToLightMinute(Number(e.currentTarget.value)),
							},
						});
					}}
				></input>
			</div>
			<Checkbox
				label="Comm Satellite"
				defaultChecked={selectedStar?.commSatellite}
				onChange={(e) => update({ commSatellite: e.currentTarget.checked })}
			/>
			{selectedStar.commSatellite && (
				<Input
					label="Comm Satellite Radius"
					helperText="The radius for how far this comm satellite can receive messages, in light years"
					inputMode="numeric"
					pattern="[0-9]*"
					key={selectedStar?.name}
					defaultValue={selectedStar.commSatelliteRadius}
					onChange={(e) => {
						update({ commSatelliteRadius: Number(e.currentTarget.value) });
					}}
					name="description"
				/>
			)}
		</div>
	);
};
