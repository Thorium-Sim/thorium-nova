import { Line, Text } from "@react-three/drei";
import { type Object3DNode, useFrame } from "@react-three/fiber";
import { type FC, useMemo, useRef } from "react";
import {
	EllipseCurve,
	type Group,
	type Mesh,
	type OrthographicCamera,
} from "three";
import type { Line2 } from "three-stdlib";

import FONT_URL from "./Teko-Light.ttf";

export const DistanceCircle: FC<{ radius?: number } & Object3DNode<any, any>> =
	({ radius = 1 }) => {
		const points = useMemo(() => {
			const curve = new EllipseCurve(
				0,
				0, // ax, aY
				radius,
				radius,
				0,
				Math.PI * 2,
				false,
				0,
			);

			const points = curve.getPoints(100);
			return points.map(({ x, y }) => [x, y, 0] as [number, number, number]);
		}, [radius]);

		const groupRef = useRef<Group>(null);
		const lineRef = useRef<Line2>(null);
		const textRef = useRef<Mesh>(null);

		useFrame((props) => {
			const camera = props.camera as OrthographicCamera;
			const dx = (camera.right - camera.left) / (2 * camera.zoom);
			if (textRef.current) {
				if (groupRef.current) {
					if (dx > radius * 4) {
						groupRef.current.visible = false;
					} else if (dx < radius) {
						groupRef.current.visible = false;
					} else {
						const opacity = Math.max(
							0,
							Math.min(1, Math.abs(1 - (dx - radius * 3) / radius)),
						);
						if (!Array.isArray(textRef.current.material)) {
							textRef.current.material.transparent = true;
							textRef.current.material.opacity = opacity;
						}
						if (lineRef.current) {
							lineRef.current.material.transparent = true;
							lineRef.current.material.opacity = opacity;
						}
						groupRef.current.visible = true;
					}
				}
				textRef.current.scale.setScalar(dx);
			}
		});
		return (
			<group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
				<Text
					color="#666" // default
					anchorX="center" // default
					anchorY="bottom-baseline" // default
					fontSize={0.075}
					font={FONT_URL}
					position={[0, radius * 1.03, 0]}
					ref={textRef}
				>
					{radius < 1
						? `${(radius * 1000).toLocaleString()}m`
						: `${radius.toLocaleString()}km`}
				</Text>
				<Line
					ref={lineRef}
					points={points} // Array of points
					color={0x666666} // Default
					lineWidth={1} // In pixels (default)
				/>
			</group>
		);
	};
