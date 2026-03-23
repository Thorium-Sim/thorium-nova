import * as React from "react";
import { useParams } from "react-router";
import { Vector3 } from "three";
import type { Camera } from "three";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "../ui/Button";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { lightYearToLightMinute } from "@thorium/utils/unitTypes";
import { useGetStarmapStore } from "./starmapStore";

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
