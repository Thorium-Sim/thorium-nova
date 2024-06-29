import React from "react";
import TextTexture from "@seregpie/three.text-texture";
import { AdditiveBlending, type Mesh, Sprite } from "three";
import { useFrame } from "@react-three/fiber";
import { useGetStarmapStore } from "../starmapStore";

const SystemLabel: React.FC<{
	systemId: string | number;
	name: string;
	color?: string;
	scale?: number;
	hoveringDirection: React.MutableRefObject<number>;
}> = ({
	systemId,
	color = "rgb(0,255,255)",
	scale = 3 / 128,
	name,
	hoveringDirection,
}) => {
	console.log({ systemId, name });
	const useStarmapStore = useGetStarmapStore();

	React.useEffect(() => {
		if (text.current) {
			if (Array.isArray(text.current.material)) return;

			text.current.material.opacity = 0.5;
		}
	}, []);

	const textTexture = React.useMemo(() => {
		const texture = new TextTexture({
			color,
			fontFamily: 'Electrolize, "Outfit", sans-serif',
			fontSize: 128,
			alignment: "right",
			text: name,
		});
		texture.redraw();
		return texture;
	}, [name, color]);

	const text = React.useRef<Mesh>(null);
	const selected = React.useRef(false);
	useFrame(({ camera }) => {
		const selectedObjectIds = useStarmapStore.getState().selectedObjectIds;
		const isSelected = selectedObjectIds.includes(systemId);
		if (text.current) {
			if (Array.isArray(text.current.material)) return;
			if (isSelected) {
				selected.current = true;
				text.current.material.opacity = 1;
				return;
			}

			if (hoveringDirection.current !== 0) {
				text.current.material.opacity = Math.max(
					0.5,
					Math.min(
						1,
						text.current.material.opacity + 0.05 * hoveringDirection.current,
					),
				);
			} else if (selected.current) {
				text.current.material.opacity = 0.5;
			}
		}
	});

	const spriteWidth = textTexture.width / textTexture.height;
	return (
		<mesh
			scale={[scale, scale, scale]}
			position={[-spriteWidth * (115 * scale) - 2, 0, 0]}
			ref={text}
			renderOrder={1000}
		>
			<planeGeometry
				args={[textTexture.width, textTexture.height, 1]}
				attach="geometry"
			/>
			<meshBasicMaterial
				attach="material"
				map={textTexture}
				transparent
				blending={AdditiveBlending}
				depthTest={false}
				depthWrite={false}
			/>
		</mesh>
	);
};
export default SystemLabel;
