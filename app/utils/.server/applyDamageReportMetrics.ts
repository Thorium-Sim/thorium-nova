import { pubsub } from "@thorium/.server/init/pubsub";
import type { Entity } from "@thorium/utils/ecs";

export function applyDamageReportMetrics(damageReport: Entity) {
	const affectedSystems = damageReport.components.damageReport?.affectedSystems;
	if (!affectedSystems) return;
	for (const system of affectedSystems) {
		const entity = damageReport.ecs.getEntityById(system.id);
		if (!entity) continue;
		const damageUpdates: Record<string, number> = {};
		for (const [key, value] of Object.entries(system.effects)) {
			const originalValue =
				Number(
					entity.components.damage?.[
						key as keyof typeof entity.components.damage
					],
				) ?? 0;
			if (typeof value === "number") {
				damageUpdates[key] = originalValue + value;
			}
		}
		entity.updateComponent("damage", damageUpdates);
	}
	pubsub.publish.damageReports.systems({
		shipId: damageReport.components.damageReport?.shipId || -1,
	});
	pubsub.publish.damageReports.damageReports({
		shipId: damageReport.components.damageReport?.shipId || -1,
	});
}
