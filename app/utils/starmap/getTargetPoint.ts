import type { shipBehavior } from "@thorium/ecs-components/shipBehavior";
import type { ECS } from "@thorium/utils/ecs";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { Vector3 } from "three";
import type z from "zod";

const targetPoint = new Vector3();
export function getTargetPoint(ecs: ECS, target: z.infer<typeof shipBehavior>["behaviorTarget"]) {
	if (!target) return targetPoint;
	if (typeof target === "object") {
		targetPoint.set(target.x, target.y, target.z);
		return targetPoint;
	}
	const targetEntity = ecs.getEntityById(target);
	if (!targetEntity) return targetPoint;

	if (targetEntity.components.position) {
		targetPoint.set(
			targetEntity.components.position.x,
			targetEntity.components.position.y,
			targetEntity.components.position.z,
		);
	}

	if (targetEntity.components.satellite) {
		const position = getOrbitPosition(targetEntity.components.satellite);
		targetPoint.set(position.x, position.y, position.z);
	}

	return targetPoint;
}
