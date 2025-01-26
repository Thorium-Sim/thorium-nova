import { useFrame } from "@react-three/fiber";
import React, { forwardRef, memo, useEffect, useRef, useState } from "react";
import {
	BackSide,
	BoxGeometry,
	type Mesh,
	type ShaderMaterial,
	CubeTexture,
} from "three";
import { useGetStarmapStore } from "../starmapStore";
import NebulaWorker from "./generateNebulaMap?worker";

const radius = 1e20;
const CANVAS_WIDTH = 2048;
let nebulaWorker: Worker | null = null;

const canvas =
	typeof window === "undefined" ? null : document.createElement("canvas");
if (canvas && "transferControlToOffscreen" in canvas) {
	nebulaWorker = new NebulaWorker();
}

const nebulaGeometry = new BoxGeometry(1, 1, 1);

const sides = ["back", "bottom", "front", "left", "right", "top"];

function Nebula() {
	const mesh = React.useRef<Mesh>(null);

	const useStarmapStore = useGetStarmapStore();

	const skyboxKey = useStarmapStore((s) => s.skyboxKey);

	// Always center the nebula on the camera
	useFrame(({ camera }) => {
		mesh.current?.position.copy(camera.position);
	});
	return (
		<>
			<mesh
				ref={mesh}
				geometry={nebulaGeometry}
				scale={radius}
				renderOrder={-100}
				dispose={null}
			>
				{/* TODO: Throw a nice default skybox in here for browsers that don't support the worker. */}
				{canvas && "transferControlToOffscreen" in canvas ? (
					<NebulaShader skyboxKey={skyboxKey} />
				) : null}
			</mesh>
		</>
	);
}

export default Nebula;

function NebulaShader({ skyboxKey }: { skyboxKey: string }) {
	const [canvases] = useState(() => {
		const primary = [];
		const offscreenPrimary = [];
		const secondary = [];
		const offscreenSecondary = [];

		for (const side of sides) {
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = CANVAS_WIDTH;
			const offscreenCanvas = canvas.transferControlToOffscreen();
			offscreenCanvas.width = offscreenCanvas.height = CANVAS_WIDTH;

			primary.push(canvas);
			offscreenPrimary.push(offscreenCanvas);
		}
		for (const side of sides) {
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = CANVAS_WIDTH;

			const offscreenCanvas = canvas.transferControlToOffscreen();
			offscreenCanvas.width = offscreenCanvas.height = CANVAS_WIDTH;

			secondary.push(canvas);
			offscreenSecondary.push(offscreenCanvas);
		}
		const primaryCube = new CubeTexture(primary);
		const secondaryCube = new CubeTexture(secondary);
		primaryCube.needsUpdate = true;
		secondaryCube.needsUpdate = true;
		return [
			primaryCube,
			secondaryCube,
			offscreenPrimary,
			offscreenSecondary,
		] as const;
	});
	const activeCanvas = useRef<0 | 1>(0);
	const shaderMaterial = useRef<ShaderMaterial>(null);
	const t = useRef(0);

	useEffect(() => {
		if (!nebulaWorker) return;
		nebulaWorker.postMessage(
			{
				type: "init",
				primaryCanvases: canvases[2],
				secondaryCanvases: canvases[3],
			},
			canvases[2].concat(canvases[3]),
		);

		function onMessage(e: MessageEvent) {
			// Set the appropriate shader uniform needsUpdate
			const activeCanvasVal = e.data.which === "secondary" ? 1 : 0;
			activeCanvas.current = activeCanvasVal;
			if (shaderMaterial.current) {
				canvases[0].needsUpdate = true;
				canvases[1].needsUpdate = true;
			}
		}
		nebulaWorker.addEventListener("message", onMessage);
		return () => nebulaWorker?.removeEventListener("message", onMessage);
	}, [canvases]);

	useEffect(() => {
		nebulaWorker?.postMessage({
			type: "render",
			seed: skyboxKey,
			which: activeCanvas.current === 0 ? "secondary" : "primary",
		});
	}, [skyboxKey]);

	const isMounted = useRef(false);
	useEffect(() => {
		setTimeout(() => {
			isMounted.current = true;
		}, 1000);
	}, []);

	useFrame((state, delta) => {
		if (activeCanvas.current === 0) {
			t.current = Math.min(1, t.current + delta / 3);
		} else {
			t.current = Math.max(0, t.current - delta / 3);
		}

		// Spam updating these when first mounting to get
		// the background visible as quickly as possible
		if (!isMounted.current) {
			canvases[0].needsUpdate = true;
			canvases[1].needsUpdate = true;
		}

		if (shaderMaterial.current) {
			shaderMaterial.current.uniforms.t.value = t.current;
		}
	});

	return <InnerShaderMat ref={shaderMaterial} canvases={canvases} />;
}

const InnerShaderMat = memo(
	forwardRef<
		ShaderMaterial,
		{
			canvases: readonly [
				CubeTexture,
				CubeTexture,
				OffscreenCanvas[],
				OffscreenCanvas[],
			];
		}
	>(({ canvases }, ref) => {
		return (
			<shaderMaterial
				side={BackSide}
				depthTest
				ref={ref}
				uniforms={{
					t: { value: 1 },
					primaryTexture: { value: canvases[0] },
					secondaryTexture: { value: canvases[1] },
				}}
				vertexShader={`
    varying vec4 coords;

    void main()	{

      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

      coords = modelMatrix * vec4( position, 1.0 );

      gl_Position = projectionMatrix * mvPosition;

    }`}
				fragmentShader={`
    uniform samplerCube primaryTexture;
    uniform samplerCube secondaryTexture;
    uniform float t;

    varying vec4 coords;

    void main() {

      vec4 primaryTex = textureCube(primaryTexture, coords.xyz);
      vec4 secondaryTex = textureCube(secondaryTexture, coords.xyz);

      gl_FragColor = vec4(primaryTex.rgb * t + secondaryTex.rgb * (1.0-t), 1.0);
    }`}
			/>
		);
	}),
);

InnerShaderMat.displayName = "InnerShaderMat";
