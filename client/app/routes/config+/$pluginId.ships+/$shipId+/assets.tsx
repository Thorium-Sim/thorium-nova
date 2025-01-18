import { useParams, Link } from "@remix-run/react";
import { useMemo, useReducer, useState } from "react";
import InfoTip from "@thorium/ui/InfoTip";
import UploadWell from "@thorium/ui/UploadWell";
import { readFile } from "@client/utils/readFile";
import { renderGLTFPreview } from "@client/utils/generateGltfImage";
import { toast } from "@client/context/ToastContext";
import { q } from "@client/context/AppContext";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
	Color,
	FrontSide,
	type Mesh,
	type MeshStandardMaterial,
	Object3D,
} from "three";

export default function Assets() {
	const { pluginId, shipId } = useParams() as {
		pluginId: string;
		shipId: string;
	};
	const [ships] = q.plugin.ship.all.useNetRequest({ pluginId });
	const ship = ships.find((d) => d.name === shipId);
	const [, render] = useReducer(() => ({}), {});
	const [path, setPath] = useState<string | null>(null);
	return (
		<div className="h-full grid grid-cols-2 grid-rows-2 gap-4 ">
			{path ? (
				<Canvas>
					<Preview path={path} />
				</Canvas>
			) : (
				<div className="max-w-md">
					<h3 className="text-lg font-bold flex items-center">
						Logo{" "}
						<InfoTip>
							Logos should be square and have a transparent background. SVGs
							work best.
						</InfoTip>
					</h3>
					<UploadWell
						accept="image/*"
						onChange={async (files) => {
							await q.plugin.ship.update.netSend({
								pluginId,
								shipId,
								logo: files[0],
							});
							render();
						}}
					>
						{ship?.assets.logo && (
							<img
								src={`${ship.assets.logo}?${new Date().getTime()}`}
								alt="Ship Logo"
								className="w-5/6 h-5/6 object-contain aspect-square"
							/>
						)}
					</UploadWell>
				</div>
			)}
			<div className="max-w-md">
				<h3 className="text-lg font-bold flex items-center">
					Model{" "}
					<InfoTip>
						Models should be in .glb format. Top and side views are
						automatically generated from the model.{" "}
						<Link
							to="/docs/plugins/ships#formatting-ship-models"
							className="text-purple-300"
						>
							Read about how to create compatible models.
						</Link>
					</InfoTip>
				</h3>
				<UploadWell
					accept="model/gltf-binary"
					onChange={async (files) => {
						toast({
							title: "Uploading",
							body: "Model is uploading. Please wait...",

							color: "info",
						});
						try {
							const file = files[0];
							const result = await readFile(file);
							setPath(result);
							const [topSrc, sideSrc, vanitySrc] = await Promise.all([
								renderGLTFPreview(result, {
									size: { width: 1200, height: 1200 },
									camera: { fov: 50, x: 0, y: 0, z: 3 },
								}),
								renderGLTFPreview(result, {
									size: { width: 1200, height: 1200 },
									camera: { fov: 50, x: 3, y: 0, z: 0, rotateZ: Math.PI / 2 },
								}),
								renderGLTFPreview(result, {
									size: { width: 1200, height: 1200 },
									camera: {
										fov: 60,
										x: 1.2,
										y: 1.5,
										z: 1.2,
										rotateZ: (3 * Math.PI) / 4,
									},
								}),
							]);
							await q.plugin.ship.update.netSend({
								pluginId,
								shipId,
								model: file,
								top: await (await fetch(topSrc)).blob(),
								side: await (await fetch(sideSrc)).blob(),
								vanity: await (await fetch(vanitySrc)).blob(),
							});
							toast({
								title: "Upload Complete",
								color: "success",
							});
							render();
						} catch (err: unknown) {
							toast({
								title: "Upload Failed",
								body: err instanceof Error ? err.message : "",
								color: "error",
							});
						}
					}}
				>
					{ship?.assets.vanity && (
						<img
							src={`${ship.assets.vanity}?${new Date().getTime()}`}
							alt="Ship Vanity View"
							className="w-5/6 h-5/6 object-contain aspect-square"
						/>
					)}
				</UploadWell>
			</div>
			<div className="max-w-md">
				<h3 className="text-lg font-bold flex items-center">Side View</h3>
				<UploadWell disabled>
					{ship?.assets.sideView && (
						<img
							src={`${ship.assets.sideView}?${new Date().getTime()}`}
							alt="Ship Side View"
							className="w-5/6 h-5/6 object-contain aspect-square"
						/>
					)}
				</UploadWell>
			</div>
			<div className="max-w-md">
				<h3 className="text-lg font-bold flex items-center">Top View</h3>
				<UploadWell disabled>
					{ship?.assets.topView && (
						<img
							src={`${ship.assets.topView}?${new Date().getTime()}`}
							alt="Ship Top View"
							className="w-5/6 h-5/6 object-contain aspect-square"
						/>
					)}
				</UploadWell>
			</div>
		</div>
	);
}

function Preview({ path }: { path: string }) {
	const model = useGLTF(path);

	const scene = useMemo(() => {
		if (!model) return new Object3D();

		const scene: Object3D = model.scene.clone(true);
		if (scene.traverse) {
			scene.traverse((object: Object3D | Mesh) => {
				if ("material" in object) {
					const material = object.material as MeshStandardMaterial;
					material.emissiveMap = material.map;
					material.emissiveIntensity = 0.3;
					material.emissive = new Color(0xffffff);
					material.side = FrontSide;

					object.castShadow = true;
					object.receiveShadow = true;
				}
			});
		}

		return scene;
	}, [model]);

	return <primitive object={scene} rotation={[Math.PI / 2, Math.PI, 0]} />;
}
