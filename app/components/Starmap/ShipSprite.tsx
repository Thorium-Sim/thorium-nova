import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { CanvasTexture, type Sprite } from "three";

export const ShipSprite = ({
	color = "red",
	spriteAsset,
	userData,
	opacity = 1,
}: {
	color?: string | number;
	spriteAsset: string;
	userData?: any;
	opacity?: number;
}) => {
	const spriteMap = useShipSprite(spriteAsset);
	const scale = 1 / 50;
	const ref = useRef<Sprite>(null);
	useFrame(() => {
		const isSelected = false;
		// TODO May 24 2022 - this is used for showing that a ship is selected.
		// const isSelected = useSelectedShips.getState().selectedIds.includes(id);
		if (isSelected) {
			ref.current?.material.color.set("#0088ff");
		} else {
			ref.current?.material.color.set(color);
		}
	});

	return (
		<sprite ref={ref} scale={[scale, scale, scale]} userData={userData}>
			<spriteMaterial
				attach="material"
				alphaMap={spriteMap}
				color={color}
				opacity={opacity}
				transparent
				sizeAttenuation={false}
				needsUpdate={true}
				depthTest={true}
				depthWrite={false}
			/>
		</sprite>
	);
};

export function useShipSprite(spriteAsset: string) {
	const canvasDimensions = 2048;
	const [canvas] = useState(() =>
		Object.assign(document.createElement("canvas"), {
			width: canvasDimensions,
			height: canvasDimensions,
		}),
	);
	const [spriteMap] = useState(() => new CanvasTexture(canvas));
	useEffect(() => {
		const ctx = canvas.getContext("2d");
		const img = new Image();
		img.src = spriteAsset;
		img.onload = () => {
			if (!ctx) return;
			// Draw the canvas
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;
			// Convert to black and white
			for (let i = 0; i < data.length; i += 4) {
				data[i] = data[i + 1] = data[i + 2] = data[i + 3];
				// data[i + 3] = 255;
			}
			ctx.putImageData(imageData, 0, 0);
			spriteMap.needsUpdate = true;
		};
	}, [spriteAsset, canvas, spriteMap]);

	return spriteMap;
}
