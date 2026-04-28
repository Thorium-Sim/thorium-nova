import { useFrame } from "@react-three/fiber";
import { useShipSprite } from "@thorium/components/Starmap/ShipSprite";
import {
	deriveDarkerThemeColor,
	getThemeButtonBorderColor,
} from "@thorium/utils/processThemeColor";
import type { Coordinates } from "@thorium/utils/unitTypes";
import { useMemo, useRef } from "react";
import type { Group } from "three";

import WaypointSvg from "./Waypoint.svg";
import WaypointStroke from "./WaypointStroke.svg";

export const WaypointEntity = ({
	position,
	isActive,
	isFacing,
	isLocked,
}: {
	position: Coordinates<number>;
	isActive: boolean;
	isFacing?: boolean;
	isLocked?: boolean;
}) => {
	const isFacingOrLocked = isFacing || isLocked;
	const { color, strokeColor } = useMemo(() => {
		const primary = getThemeButtonBorderColor("btn-primary", "#65abc4");
		const warning = getThemeButtonBorderColor("btn-warning", "#c7935e");
		const notice = getThemeButtonBorderColor("btn-notice", "#935dc9");
		const primaryFocus = deriveDarkerThemeColor(primary);
		const warningFocus = deriveDarkerThemeColor(warning);
		const noticeFocus = deriveDarkerThemeColor(notice);
		return {
			color: isFacingOrLocked ? primary : isActive ? warning : notice,
			strokeColor: isFacingOrLocked ? primaryFocus : isActive ? warningFocus : noticeFocus,
		};
	}, [isFacingOrLocked, isActive]);
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
					toneMapped={false}
				/>
			</sprite>
			<sprite renderOrder={100} position={[0, 0, -0.5]}>
				<spriteMaterial
					attach="material"
					map={strokeMap}
					color={strokeColor}
					sizeAttenuation={true}
					toneMapped={false}
				/>
			</sprite>
		</group>
	);
};
