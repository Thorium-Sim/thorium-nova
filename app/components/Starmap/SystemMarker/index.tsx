import { type ElementProps, useFrame } from "@react-three/fiber";
import { setCursor } from "@thorium/utils/setCursor";
import { lightYearToLightMinute } from "@thorium/utils/unitTypes";
import React from "react";
import { Group, type Mesh, Vector3 } from "three";
import { useGetStarmapStore } from "../starmapStore";
import SystemCircle from "./SystemCircle";
import SystemLabel from "./SystemLabel";

interface SystemMarkerProps extends ElementProps<typeof Mesh> {
	systemId: string | number;
	name: string;
	position: [number, number, number];
	draggable?: boolean;
	commSatelliteRadius: number | null;
	commSatelliteColor?: number | null;
	onPointerDown?: () => void;
}

const SystemMarker: React.FC<SystemMarkerProps> = ({
	systemId,
	name,
	position,
	draggable,
	commSatelliteRadius,
	commSatelliteColor,
	...props
}) => {
	const group = React.useRef<Group>(new Group());
	const useStarmapStore = useGetStarmapStore();

	const direction = React.useRef(0);
	const cameraView = useStarmapStore((state) => state.cameraView);
	const showSatelliteRange = useStarmapStore(
		(state) => state.showSatelliteRange,
	);

	useFrame(({ camera }) => {
		const zoom = group.current?.position
			? camera.position.distanceTo(group.current?.position)
			: 1;

		const zoomedScale = Math.max(
			Math.min(zoom ** (1 / 3) * 5000, zoom / 120),
			zoom / 250,
		);

		group.current?.scale.set(zoomedScale, zoomedScale, zoomedScale);
		group.current?.quaternion.copy(camera.quaternion);
	});
	const positionVector = new Vector3(...position);
	if (cameraView === "2d") positionVector.setY(0);
	return (
		<>
			{showSatelliteRange && commSatelliteRadius ? (
				<mesh
					position={positionVector}
					scale={[
						commSatelliteRadius,
						commSatelliteRadius,
						commSatelliteRadius,
					]}
				>
					<sphereGeometry args={[lightYearToLightMinute(1), 16, 16]} />
					<meshBasicMaterial
						color={commSatelliteColor ?? 0xff8800}
						transparent
						opacity={0.2}
						depthTest={false}
					/>
				</mesh>
			) : null}
			<group position={positionVector} ref={group}>
				{/* {draggable ? (
					<DraggableSystemCircle
						systemId={systemId}
						hoveringDirection={direction}
						parentObject={group}
						position={position}
						{...props}
						onPointerOver={(e) => {
							props?.onPointerOver?.(e);
							direction.current = 1;
							setCursor("pointer");
						}}
						onPointerOut={(e) => {
							props?.onPointerOut?.(e);
							direction.current = -1;
							setCursor("auto");
						}}
					/>
				) : ( */}
				<SystemCircle
					systemId={systemId}
					hoveringDirection={direction}
					{...props}
					onPointerOver={(e) => {
						props?.onPointerOver?.(e);
						direction.current = 1;
						setCursor("pointer");
					}}
					onPointerOut={(e) => {
						props?.onPointerOut?.(e);
						direction.current = -1;
						setCursor("auto");
					}}
				/>
				{/* )} */}
				<SystemLabel
					systemId={systemId}
					hoveringDirection={direction}
					name={name}
				/>
			</group>{" "}
		</>
	);
};

export default SystemMarker;
