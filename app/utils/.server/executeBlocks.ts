import type { DataContext } from "@thorium/.server/DataContext";
import { spawnTrigger } from "@thorium/.server/spawners/trigger";
import type { ComponentProperties } from "@thorium/ecs-components";
import type { TimelineBlock } from "@thorium/routes/config/timelines/builder/TimelineBlockTypes";
import { triggerSend } from "@thorium/utils/.server/evaluateEntityQuery";
import {
	getShipSystem,
	getShipSystems,
} from "@thorium/utils/.server/ship/getShipSystem";
import type { Entity } from "@thorium/utils/ecs";
import { produce } from "immer";

export async function executeBlocks(
	context: DataContext,
	blocks: TimelineBlock[],
	stepId?: number,
	localVariables: Record<string, any> = {},
	theResult: any = null,
) {
	if (!context.flight) return;

	for (const block of blocks) {
		switch (block.type) {
			case "Wait": {
				const timer =
					block.time *
					(block.unit === "seconds"
						? 1000
						: block.unit === "minutes"
							? 60 * 1000
							: 1);
				await new Promise((res) => setTimeout(res, timer));
				break;
			}
			case "VariableIntoVariable": {
				const entity = getEntityReference(
					block.entity,
					context,
					stepId,
					localVariables,
				);
				if (!entity)
					throw new Error(
						`Attempted to put an entity variable "${block.entity}" into a local variable, but the entity wasn't found.`,
					);
				localVariables[block.variable] =
					entity.components.variables?.variables.find(
						(v) => v.name === block.getVariable,
					);
				break;
			}
			case "EntityPropertyIntoVariable": {
				const entity = getEntityReference(
					block.entity,
					context,
					stepId,
					localVariables,
				);
				const component = entity?.components[
					block.component as keyof ComponentProperties
				] as any;
				localVariables[block.variable] = component?.[block.property];
				break;
			}
			case "IfCondition": {
				for (const condition of block.conditions) {
					if (evaluateCondition(condition, localVariables)) {
						// We don't await this so we can run concurrently with the parent blocks
						executeBlocks(context, block.triggerBlocks, stepId, localVariables);
					}
				}
				break;
			}
			case "ResultPropertyIntoVariable": {
				localVariables[block.variable] = theResult?.[block.property];
				break;
			}
			case "SetVariable": {
				const entity = getEntityReference(
					block.entity,
					context,
					stepId,
					localVariables,
				);

				entity?.updateComponent("variables", {
					variables: produce(
						entity.components.variables?.variables || [],
						(draft) => {
							const variable = draft.find((d) => d.name === block.variable);
							if (variable) variable.value = block.value;
							else
								draft.push({
									name: block.variable,
									type: "any",
									value: block.value,
								});
						},
					),
				});
				break;
			}
			case "ShipSystemGetter": {
				const entity = getEntityReference(
					block.entity,
					context,
					stepId,
					localVariables,
				);
				if (!entity) return;
				if (block.count === "one") {
					localVariables[block.variable] = getShipSystem(context.ecs, {
						systemType: block.systemType as any,
						shipId: entity.id,
					});
				} else {
					localVariables[block.variable] = getShipSystems(context.ecs, {
						systemType: block.systemType as any,
						shipId: entity.id,
					});
				}
				break;
			}
			case "DistanceCondition": {
				const entityA = getEntityReference(
					block.entity1,
					context,
					stepId,
					localVariables,
				);
				const entityB = getEntityReference(
					block.entity2,
					context,
					stepId,
					localVariables,
				);
				if (!entityA || !entityB) return;
				const triggerEntity = spawnTrigger({
					trigger: {
						stepId,
						triggeredAt: null,
						active: true,
						conditions: [
							{
								type: "distance",
								distance: block.distance,
								condition: block.comparison,
								entityA: entityA.id,
								entityB: entityB.id,
							},
						],
						blocks: block.triggerBlocks,
						localVariables,
					},
				});
				context.ecs.addEntity(triggerEntity);
				break;
			}
			case "EntityCondition": {
				const triggerEntity = spawnTrigger({
					trigger: {
						stepId,
						triggeredAt: null,
						active: true,
						conditions: [
							{
								type: "entityMatch",
								matchCount: block.match,
								query: block.checks,
							},
						],
						blocks: block.triggerBlocks,
						localVariables,
					},
				});
				context.ecs.addEntity(triggerEntity);

				break;
			}
			case "EventCondition": {
				const triggerEntity = spawnTrigger({
					trigger: {
						stepId,
						triggeredAt: null,
						active: true,
						conditions: [
							{
								type: "eventListener",
								event: block.event,
							},
						],
						blocks: block.triggerBlocks,
						localVariables,
					},
				});
				context.ecs.addEntity(triggerEntity);
				break;
			}
			case "Action": {
				theResult = await triggerSend(block.action, block.values);
				break;
			}
		}
		// const values = evaluateAction(context.flight.ecs, action);
		// for (const value of values) {
		// 	try {
		// 		// This await is mostly so we can do a delay action
		// 		if (action.action === "triggers.create") {
		// 			value.stepId = stepId;
		// 		}
		// 		await triggerSend(action.action, value, context);
		// 	} catch (error) {
		// 		console.error("Error executing action:", action.action, error);
		// 	}
		// }
	}
}

function evaluateCondition(
	condition: {
		value1: string;
		value2: string;
		comparison: string;
	},
	localVariables: Record<string, any>,
) {
	const val1 = getValueReference(condition.value1, localVariables);
	const val2 = getValueReference(condition.value2, localVariables);
	switch (condition.comparison) {
		case "=": {
			// biome-ignore lint/suspicious/noDoubleEquals: <explanation>
			return val1 == val2;
		}
		case "!=": {
			// biome-ignore lint/suspicious/noDoubleEquals: <explanation>
			return val1 != val2;
		}
		case ">": {
			return val1 > val2;
		}
		case ">=": {
			return val1 >= val2;
		}
		case "<": {
			return val1 < val2;
		}
		case "<=": {
			return val1 <= val2;
		}
		case "contains": {
			return "contains" in val1 && val1.contains(val2);
		}
	}
	return false;
}

function getValueReference(ref: string, variables: Record<string, any>) {
	if (ref.startsWith("$")) {
		return variables[ref.replace("$", "")];
	}
	return ref;
}
function getEntityReference(
	ref: any,
	ctx: DataContext,
	stepId: number | undefined,
	variables: Record<string, any>,
): Entity | null {
	// An entity stored as a variable
	if (typeof ref === "object" && "id" in ref && "components" in ref) {
		return ref;
	}
	// Getting the timeline itself
	if (!ref || ref === "this timeline" || ref === "timeline") {
		if (!stepId) {
			throw new Error(
				"Attempted to access timeline reference, but no stepId was provided. Is this block in a timeline?",
			);
		}
		const stepEntity = ctx.ecs.getEntityById(stepId);
		const timelineEntity = ctx.ecs.getEntityById(
			stepEntity?.components.isTimelineStep?.timelineId || -1,
		);
		return timelineEntity;
	}
	if (typeof ref === "string") {
		// Tag
		if (ref.startsWith("#")) {
			const tag = ref.replace("#", "");
			for (const entity of ctx.ecs.componentCache.get("tags") || []) {
				if (entity.components.tags?.tags.includes(tag)) return entity;
			}
		}
		// Variable
		if (ref.startsWith("$")) {
			const varItem = variables[ref.replace("$", "")];
			return getEntityReference(varItem, ctx, stepId, variables);
		}
		// ID
		if (!Number.isNaN(Number(ref))) {
			return ctx.ecs.getEntityById(Number(ref));
		}
		for (const entity of ctx.ecs.componentCache.get("identity") || []) {
			if (entity.components.identity?.name === ref) return entity;
		}
	}
	return null;
}
