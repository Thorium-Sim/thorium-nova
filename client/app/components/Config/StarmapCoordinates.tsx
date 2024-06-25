import Input from "@thorium/ui/Input";
import { useState, useEffect, Suspense } from "react";
import { Icon } from "@thorium/ui/Icon";
import Button from "@thorium/ui/Button";
import {
	flip,
	offset,
	shift,
	useClick,
	useFloating,
	useInteractions,
} from "@floating-ui/react";
import {
	StarmapStoreProvider,
	useGetStarmapStore,
} from "../Starmap/starmapStore";
import StarmapCanvas from "../Starmap/StarmapCanvas";
import { ClientOnly } from "remix-utils/client-only";
import Nebula from "../Starmap/Nebula";
import { useParams } from "@remix-run/react";
import { StatusBar } from "@client/routes/config+/$pluginId.starmap";
import InterstellarWrapper from "@client/routes/config+/$pluginId.starmap._index";
import SolarSystemWrapper from "@client/routes/config+/$pluginId.starmap.$systemId";
import { useTexture } from "@react-three/drei";
import FuzzTexture from "../../cards/Viewscreen/fuzz.png";
import { Plane, Vector3 } from "three";
import { q } from "@client/context/AppContext";
import { getOrbitPosition } from "@server/utils/getOrbitPosition";

export function StarmapCoordinates({
	value,
	setValue,
}: {
	value?: {
		x: number;
		y: number;
		z: number;
		parentId: { name: string; pluginId: string } | null;
	};
	setValue: (value: { x?: number; y?: number; z?: number }) => void;
}) {
	return (
		<div>
			<div className="flex">
				<StarmapPicker value={value} setValue={setValue} />
				<Input
					className="input-sm w-32"
					label="X"
					value={value?.x || ""}
					onChange={(event) =>
						!Number.isNaN(Number(event.target.value)) &&
						setValue({ ...value, x: Number(event.target.value) })
					}
				/>
				<Input
					className="input-sm w-32"
					label="Y"
					value={value?.y || ""}
					onChange={(event) =>
						!Number.isNaN(Number(event.target.value)) &&
						setValue({ ...value, y: Number(event.target.value) })
					}
				/>
				<Input
					className="input-sm w-32"
					label="Z"
					value={value?.z || ""}
					onChange={(event) =>
						!Number.isNaN(Number(event.target.value)) &&
						setValue({ ...value, z: Number(event.target.value) })
					}
				/>
			</div>
			{value && value.x !== 0 && value.y !== 0 && value.z !== 0 ? (
				<div>
					System: {value.parentId ? value.parentId.name : "Interstellar"}
				</div>
			) : null}
		</div>
	);
}
function StarmapPicker({
	value,
	setValue,
}: {
	value?: {
		x: number;
		y: number;
		z: number;
		parentId: { name: string; pluginId: string } | null;
	};
	setValue: (v: any) => void;
}) {
	const [open, setOpen] = useState(false);

	const { x, y, refs, strategy, context } = useFloating({
		placement: "left",
		middleware: [offset(10), flip(), shift()],
		open,
		onOpenChange: setOpen,
	});

	const { getReferenceProps, getFloatingProps } = useInteractions([
		useClick(context),
	]);

	return (
		<>
			<Button
				className="btn-xs btn-primary btn-outline self-end"
				ref={refs.setReference}
				{...getReferenceProps()}
			>
				<Icon name="star" />
			</Button>
			{open && (
				<div
					ref={refs.setFloating}
					style={{
						position: strategy,
						top: y ?? 0,
						left: x ?? 0,
					}}
					className="z-50 drop-shadow-xl bg-black/90 border-white/50 border-2 rounded w-full aspect-square"
					{...getFloatingProps()}
				>
					<Suspense fallback={null}>
						<StarmapStoreProvider>
							<div className="border-b border-b-white/20 pb-0.5 px-2 flex gap-2 items-baseline">
								{/* <StarmapCoreMenubar /> */}
							</div>
							<StarmapCoordinatePicker
								setValue={setValue}
								system={value?.parentId?.name || null}
							>
								{value && value.x !== 0 && value.y !== 0 && value.z !== 0 ? (
									<PositionPoint position={value} />
								) : null}
							</StarmapCoordinatePicker>
						</StarmapStoreProvider>
					</Suspense>
					{value?.parentId ? (
						<Button
							className="absolute bottom-0 left-0 btn-xs btn-primary btn-outline"
							onClick={() =>
								setValue({
									x: 0,
									y: 0,
									z: 0,
									parentId: null,
								})
							}
						>
							To Interstellar
						</Button>
					) : null}
				</div>
			)}
		</>
	);
}
const plane = new Plane();
const forward = new Vector3();
const center = new Vector3();
function StarmapCoordinatePicker({
	children,
	system,
	setValue,
}: {
	children: React.ReactNode;
	system: string | null;
	setValue: (v: any) => void;
}) {
	const useStarmapStore = useGetStarmapStore();

	const { pluginId } = useParams() as {
		pluginId: string;
	};

	const [systemData] = q.plugin.starmap.get.useNetRequest(
		{
			pluginId,
			solarSystemId: system!,
		},
		{ enabled: !!system, placeholderData: { stars: [], planets: [] } },
	);

	useEffect(() => {
		useStarmapStore.getState().setCameraControlsEnabled(true);
		useStarmapStore.setState({
			viewingMode: "editor",
		});
	}, [useStarmapStore]);

	return (
		<>
			<StarmapCanvas
				onPointerMissed={(event) => {
					const selected = useStarmapStore.getState().selectedObjectIds[0];
					if (selected) {
						const object =
							systemData?.planets.find((p) => p.name === selected) ||
							systemData?.stars.find((s) => s.name === selected);
						if (object) {
							const position = getOrbitPosition(object.satellite);
							center.copy(position);
						}
					} else {
						center.set(0, 0, 0);
					}
					// Ignore right and middle clicks
					if (event.button !== 0) return;
					// Construct a plane perpendicular to the camera that goes through
					// the origin
					const camera =
						useStarmapStore.getState().cameraControls?.current?.camera;
					if (!camera) return;
					// Calculate the camera's forward vector
					camera.getWorldDirection(forward);
					plane.setFromNormalAndCoplanarPoint(forward, center);
					const coordinates = useStarmapStore
						.getState()
						.translate2DTo3D?.(event.clientX, event.clientY, plane);
					if (!coordinates) return;
					setValue({
						x: coordinates.x,
						y: coordinates.y,
						z: coordinates.z,
						parentId: { name: system, pluginId },
					});
				}}
			>
				<ambientLight intensity={0.2} />
				<pointLight />
				{system ? (
					<SolarSystemWrapper systemId={system}>{children}</SolarSystemWrapper>
				) : (
					<InterstellarWrapper
						draggable={false}
						onDoubleClick={(systemId) =>
							setValue({
								x: 0,
								y: 0,
								z: 0,
								parentId: { name: systemId, pluginId },
							})
						}
					>
						{children}
					</InterstellarWrapper>
				)}
				<ClientOnly>{() => <Nebula />}</ClientOnly>
			</StarmapCanvas>
			<StatusBar />
		</>
	);
}
function PositionPoint({
	position,
}: { position: { x: number; y: number; z: number } }) {
	const spriteMap = useTexture(FuzzTexture);

	return (
		<sprite
			position={[position.x || 0, position.y || 0, position.z || 0]}
			scale={0.05}
		>
			<spriteMaterial color={65280} map={spriteMap} sizeAttenuation={false} />
		</sprite>
	);
}
