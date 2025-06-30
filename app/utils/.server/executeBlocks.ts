import type { DataContext } from "@thorium/.server/DataContext";
import { spawnTrigger } from "@thorium/.server/spawners/trigger";
import type { ComponentProperties } from "@thorium/ecs-components";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { triggerAction } from "./triggerAction";
import {
	getShipSystem,
	getShipSystems,
} from "@thorium/utils/.server/ship/getShipSystem";
import type { ECS, Entity } from "@thorium/utils/ecs";
import { produce } from "immer";

export async function executeBlocks(
	ecs: ECS,
	blocks: TimelineBlock[],
	stepId?: number,
	localVariables: Record<string, any> = {},
	theResult: any = null,
) {
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
					ecs,
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
					)?.value;
				break;
			}
			case "EntityPropertyIntoVariable": {
				const entity = getEntityReference(
					block.entity,
					ecs,
					stepId,
					localVariables,
				);
				let value: any = "";
				if (block.component === "id") {
					value = entity?.id;
				} else {
					const component = entity?.components[
						block.component as keyof ComponentProperties
					] as any;
					value = component?.[block.property];
				}
				localVariables[block.variable] = value;
				break;
			}
			case "IfCondition": {
				for (const condition of block.conditions) {
					if (evaluateCondition(condition, localVariables)) {
						await executeBlocks(
							ecs,
							block.triggerBlocks,
							stepId,
							localVariables,
						);
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
					ecs,
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
					ecs,
					stepId,
					localVariables,
				);
				if (!entity) return;
				if (block.count === "one") {
					localVariables[block.variable] = getShipSystem(ecs, {
						systemType: block.systemType as any,
						shipId: entity.id,
					});
				} else {
					localVariables[block.variable] = getShipSystems(ecs, {
						systemType: block.systemType as any,
						shipId: entity.id,
					});
				}
				break;
			}
			case "DistanceCondition": {
				const entityA = getEntityReference(
					block.entity1,
					ecs,
					stepId,
					localVariables,
				);
				const entityB = getEntityReference(
					block.entity2,
					ecs,
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
				ecs.addEntity(triggerEntity);
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
				ecs.addEntity(triggerEntity);

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
				ecs.addEntity(triggerEntity);
				break;
			}
			case "Action": {
				const values = Object.fromEntries(
					Object.entries(block.values).map(([key, value]) => {
						let val = getValueReference(value, localVariables);
						// Special handling for certain keys we know are entity id references
						if (key === "shipId") {
							val = Number(val);
						}
						return [key, val];
					}),
				);
				theResult = await triggerAction(block.action, values);
				break;
			}
			case "RandomIntoVariable": {
				const number1 = Number(
					getValueReference(block.number1, localVariables),
				);
				const number2 = Number(
					getValueReference(block.number2, localVariables),
				);
				const min = number1 < number2 ? number1 : number2;
				const max = number1 < number2 ? number2 : number1;
				if (block.numberType === "integer") {
					localVariables[block.variable] = ecs.rng.nextInt(min, max).toString();
				} else {
					localVariables[block.variable] = String(
						ecs.rng.next() * (max - min) + min,
					);
				}
				break;
			}
			case "MathIntoVariable": {
				const num1 = Number(getValueReference(block.number1, localVariables));
				const num2 = Number(getValueReference(block.number2, localVariables));
				switch (block.operation) {
					case "+":
						localVariables[block.variable] = String(num1 + num2);
						break;
					case "-":
						localVariables[block.variable] = String(num1 - num2);
						break;
					case "×":
						localVariables[block.variable] = String(num1 * num2);
						break;
					case "÷":
						localVariables[block.variable] = String(num1 / num2);
						break;
				}

				break;
			}
			case "Macro": {
				// Execute all of the blocks of the macro
				const macro = ecs?.server.plugins
					.find((p) => p.id === block.pluginId)
					?.aspects.macros.find((m) => m.name === block.macroId);
				if (!macro)
					throw new Error(
						`Attempted to execute macro ${block.macroId} from plugin ${block.pluginId}, but it wasn't found.`,
					);
				await executeBlocks(
					ecs,
					macro.blocks,
					stepId,
					localVariables,
					theResult,
				);
			}
		}
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

function getValueReference(ref: string, variables: Record<string, any>): any {
	if (typeof ref === "string" && ref.startsWith("$")) {
		return getValueReference(variables[ref.replace("$", "")], variables);
	}
	return ref;
}
function getEntityReference(
	ref: any,
	ecs: ECS,
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
		const stepEntity = ecs.getEntityById(stepId);
		const timelineEntity = ecs.getEntityById(
			stepEntity?.components.isTimelineStep?.timelineId || -1,
		);
		return timelineEntity;
	}
	if (typeof ref === "number") {
		return ecs.getEntityById(ref);
	}
	if (typeof ref === "string") {
		// Tag
		if (ref.startsWith("#")) {
			const tag = ref.replace("#", "");
			for (const entity of ecs.componentCache.get("tags") || []) {
				if (entity.components.tags?.tags.includes(tag)) return entity;
			}
		}
		// Variable
		if (ref.startsWith("$")) {
			const varItem = variables[ref.replace("$", "")];
			return getEntityReference(varItem, ecs, stepId, variables);
		}
		// ID
		if (!Number.isNaN(Number(ref))) {
			return ecs.getEntityById(Number(ref));
		}
		for (const entity of ecs.componentCache.get("identity") || []) {
			if (entity.components.identity?.name === ref) return entity;
		}
	}

	return null;
}
