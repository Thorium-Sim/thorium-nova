import { useRef } from "react";
import type { Group } from "three";

import WaypointSvg from "./Waypoint.svg";
import WaypointStroke from "./WaypointStroke.svg";
import { useFrame } from "@react-three/fiber";
import type { Coordinates } from "@thorium/utils/unitTypes";
import { useShipSprite } from "@thorium/components/Starmap/StarmapShip";

export const WaypointEntity = ({
	position,
	isActive,
	isFacing,
	isLocked,
}: { position: Coordinates<number>; isActive: boolean; isFacing?: boolean; isLocked?: boolean }) => {
	const isBlue = isFacing || isLocked;
	// These colors match the waypoint-* tokens in tailwind.config.ts
	const color = isBlue
		? "rgb(0,136,255)"
		: isActive
			? "rgb(230,153,0)"
			: "rgb(206,164,255)";
	const strokeColor = isBlue
		? "rgb(0,68,128)"
		: isActive
			? "rgb(110,73,0)"
			: "#663399";
	const spriteMap = useShipSprite(WaypointSvg);
	const strokeMap = useShipSprite(WaypointStroke);
	const group = useRef<Group>(null);
	const scale = 1 / 10;

	useFrame(({ camera }) => {
		if (position) {
			group.current?.position.set(position.x, position.y, position.z);
			let zoom = 0;
			if (group.current) {
				zoom = camera.position.distanceTo(group.current.position) + 500;
				const zoomedScale = (zoom / 2) * scale;
				group.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
			}
		}
	});
	return (
		<group ref={group} renderOrder={100}>
			<sprite renderOrder={101} position={[0, 0, -0.5]}>
				<spriteMaterial
					attach="material"
					map={spriteMap}
					color={color}
					sizeAttenuation={true}
				/>
			</sprite>
			<sprite renderOrder={100} position={[0, 0, -0.5]}>
				<spriteMaterial
					attach="material"
					map={strokeMap}
					color={strokeColor}
					sizeAttenuation={true}
				/>
			</sprite>
		</group>
	);
};
