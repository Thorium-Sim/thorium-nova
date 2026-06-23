import { evaluateTriggerCondition } from "@thorium/utils/.server/evaluateEntityQuery";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import type { ECS } from "@thorium/utils/ecs";

export async function processTriggers(ecs: ECS, event?: { event: string; values: any }) {
	const triggers = [...(ecs.componentCache.get("isTrigger") || [])];
	if (!triggers) return;
	for (const trigger of triggers) {
		if (!trigger.components.isTrigger || !trigger.components.isTrigger.active) continue;
		const { conditions, blocks, stepId, localVariables, callReturnBlocks } =
			trigger.components.isTrigger;
		const match = evaluateTriggerCondition(ecs, conditions, event);
		if (match) {
			trigger.updateComponent("isTrigger", {
				triggeredAt: new Date(),
				...(trigger.components.isTrigger.multiple ? {} : { active: false }),
			});
			await executeBlocks(
				ecs,
				blocks.map((action) => {
					if (action.action === "timeline.advance") {
						return {
							...action,
							values: {
								...action.values,
								stepId: stepId,
							},
						};
					}
					return action;
				}),
				{ stepId, localVariables, theResult: match, callReturnBlocks },
			);
		}
	}
}
