import type { AllSends } from "@thorium/.server/init/router";
import { spawnTrigger } from "@thorium/.server/spawners/trigger";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import type { ComponentProperties } from "@thorium/ecs-components";
import { evaluateTriggerCondition } from "@thorium/utils/.server/evaluateEntityQuery";
import { getShipSystem, getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { Entity, type ECS } from "@thorium/utils/ecs";
import { interpolateText } from "@thorium/utils/interpolationEngine";
import { produce } from "immer";

import uniqid from "../uniqid";
import { scheduleBlocks } from "./scheduleAction";
import { triggerAction } from "./triggerAction";

export class TimelineAvailability {
	constructor(public isAvailable: boolean) {}
}

export interface BlockMetadata {
	stepId?: number;
	localVariables?: Record<string, any>;
	theResult?: any;
	executionType?: "prerequisite" | "main";
	callReturnBlocks?: TimelineBlock[];
}

export async function executeBlocks(
	ecs: ECS,
	blocks: TimelineBlock[],
	blockMetadata: BlockMetadata = {},
) {
	let {
		stepId,
		localVariables = {},
		theResult = null,
		executionType = "main",
		callReturnBlocks,
	} = blockMetadata;
	let blockIndex = 0;
	for (const block of blocks) {
		switch (block.type) {
			case "Wait": {
				const timer =
					block.time * (block.unit === "seconds" ? 1000 : block.unit === "minutes" ? 60 * 1000 : 1);

				scheduleBlocks(
					ecs,
					[{ id: uniqid("blk-"), type: "WaitComplete" }, ...blocks.slice(blockIndex + 1)],
					{
						stepId,
						localVariables,
						theResult,
						executionType,
						callReturnBlocks,
					},
					timer,
				);

				return;
			}
			case "WaitComplete": {
				// If the timeline step is already marked as completed
				// then we should skip executing the rest of the blocks
				if (ecs.getEntityById(stepId || -1)?.components.isTimelineStep?.state === "executed") {
					return;
				}
				break;
			}
			case "VariableIntoVariable": {
				const entity = getEntityReference(block.entity, ecs, stepId, localVariables);
				if (!entity)
					throw new Error(
						`Attempted to put an entity variable "${block.entity}" into a local variable, but the entity wasn't found.`,
					);
				localVariables[block.variable] = entity.components.variables?.variables.find(
					(v) => v.name === block.getVariable,
				)?.value;
				break;
			}
			case "EntityPropertyIntoVariable": {
				const entity = getEntityReference(block.entity, ecs, stepId, localVariables);
				let value: any = "";
				if (block.component === "id") {
					value = entity?.id;
				} else {
					const component = entity?.components[block.component as keyof ComponentProperties] as any;
					value = component?.[block.property];
				}
				localVariables[block.variable] = value;
				break;
			}
			case "IfCondition": {
				let response = true;

				for (const condition of block.conditions) {
					if (!evaluateCondition(condition, localVariables, ecs)) {
						response = false;
						break;
					}
				}
				if (response) {
					await executeBlocks(ecs, block.triggerBlocks, {
						stepId,
						localVariables,
						executionType,
						callReturnBlocks,
					});
				}
				break;
			}
			case "ResultPropertyIntoVariable": {
				localVariables[block.variable] = theResult?.[block.property];
				break;
			}
			case "SetVariable": {
				const value = getValueReference(block.value, localVariables, ecs);
				if (block.entity.toLowerCase() === "this step" || block.entity.toLowerCase() === "step") {
					localVariables[block.variable] = value;
					break;
				}
				const entity = getEntityReference(block.entity, ecs, stepId, localVariables);

				entity?.updateComponent("variables", {
					variables: produce(entity.components.variables?.variables || [], (draft) => {
						const variable = draft.find((d) => d.name === block.variable);
						if (variable) variable.value = value;
						else
							draft.push({
								name: block.variable,
								type: "any",
								value: value,
							});
					}),
				});
				break;
			}
			case "ShipSystemGetter": {
				const entity = getEntityReference(block.entity, ecs, stepId, localVariables);
				if (!entity) return;
				if (block.count === "one") {
					localVariables[block.variable] = getShipSystem(ecs, {
						systemType: block.systemType as any,
						shipId: entity.id,
					})?.id;
				} else {
					localVariables[block.variable] = getShipSystems(ecs, {
						systemType: block.systemType as any,
						shipId: entity.id,
					}).map((e) => e.id);
				}
				break;
			}
			case "DistanceCondition": {
				const entityA = getEntityReference(block.entity1, ecs, stepId, localVariables);
				const entityB = getEntityReference(block.entity2, ecs, stepId, localVariables);
				if (!entityA || !entityB) return;
				const conditions = [
					{
						type: "distance" as const,
						distance: block.distance,
						condition: block.comparison,
						entityA: entityA.id,
						entityB: entityB.id,
					},
				];
				if (executionType === "main") {
					const triggerEntity = spawnTrigger({
						trigger: {
							stepId,
							triggeredAt: null,
							active: true,
							conditions,
							blocks: block.triggerBlocks,
							callReturnBlocks,
							multiple: false,
							persist: block.persist,
							localVariables,
						},
					});
					ecs.addEntity(triggerEntity);
				}
				if (executionType === "prerequisite") {
					// Evaluate prerequisites immediately
					const match = evaluateTriggerCondition(ecs, conditions);
					if (match) {
						await executeBlocks(ecs, block.triggerBlocks, {
							stepId,
							localVariables,
							theResult: match,
							executionType,
							callReturnBlocks,
						});
					}
				}
				break;
			}
			case "EntityCondition": {
				const conditions = [
					{
						type: "entityMatch" as const,
						matchCount: block.match,
						query: block.checks.map((check) => {
							return {
								...check,
								value: check.value
									? getValueReference(check.value, localVariables, ecs)
									: undefined,
							};
						}),
					},
				];
				if (executionType === "main") {
					const triggerEntity = spawnTrigger({
						trigger: {
							stepId,
							triggeredAt: null,
							active: true,
							conditions,
							blocks: block.triggerBlocks,
							callReturnBlocks,
							multiple: false,
							persist: block.persist,
							localVariables,
						},
					});
					ecs.addEntity(triggerEntity);
				}
				if (executionType === "prerequisite") {
					// Evaluate prerequisites immediately
					const match = evaluateTriggerCondition(ecs, conditions);
					if (match) {
						await executeBlocks(ecs, block.triggerBlocks, {
							stepId,
							localVariables,
							theResult: match,
							executionType,
							callReturnBlocks,
						});
					}
				}
				break;
			}
			case "EventCondition": {
				const conditions = [
					{
						type: "eventListener" as const,
						event: block.event,
					},
				];
				// We don't evaluate event conditions for prerequisites.
				if (executionType === "prerequisite") break;
				if (executionType === "main") {
					const triggerEntity = spawnTrigger({
						trigger: {
							stepId,
							triggeredAt: null,
							active: true,
							conditions,
							blocks: block.triggerBlocks,
							callReturnBlocks,
							multiple: block.multiple,
							persist: block.persist,
							localVariables,
						},
					});
					ecs.addEntity(triggerEntity);
				}
				break;
			}
			case "Action": {
				try {
					const step = ecs.getEntityById(stepId || -1);
					const values = {
						...(step?.components.isTimelineStep?.timelineId
							? { timelineId: step?.components.isTimelineStep?.timelineId }
							: {}),
						...Object.fromEntries(
							Object.entries(block.values).map(([key, value]) => {
								if (Array.isArray(value)) {
									return [key, value.map((v) => processValues(v, key))];
								}
								return [key, processValues(value, key)];
							}),
						),
					};

					theResult = await triggerAction(block.action as AllSends, values);

					function processValues(value: any, key: string) {
						// It grieves me to no end that this exists
						// There is probably a more sophisticated way to do this, where
						// the type of the value is matched with the expected type on the action, but
						// we haven't reached the point where that's necessary
						const entityExceptions = ["station"];
						let val = getValueReference(value, localVariables, ecs, entityExceptions.includes(key));
						// Special handling for certain keys we know are entity id references or numbers
						if (typeof val === "boolean" || typeof val === "number") {
						} else if (value !== "" && !Number.isNaN(Number(val)) && key !== "alertLevel") {
							val = Number(val);
						} else if (typeof val === "string") {
							// Other values get interpolated automatically
							val = interpolateText(val, localVariables, ecs.rng);
						}
						return val;
					}
				} catch (error) {
					console.error(
						"Failed to execute Action block",
						block.action,
						block.values,
						localVariables,
					);
					console.dir(error);
				}
				break;
			}
			case "RandomIntoVariable": {
				const number1 = Number(getValueReference(block.number1, localVariables, ecs));
				const number2 = Number(getValueReference(block.number2, localVariables, ecs));
				const min = number1 < number2 ? number1 : number2;
				const max = number1 < number2 ? number2 : number1;
				if (block.numberType === "integer") {
					localVariables[block.variable] = ecs.rng.nextInt(min, max).toString();
				} else {
					localVariables[block.variable] = String(ecs.rng.next() * (max - min) + min);
				}
				break;
			}
			case "MathIntoVariable": {
				const num1 = Number(getValueReference(block.number1, localVariables, ecs));
				const num2 = Number(getValueReference(block.number2, localVariables, ecs));
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
			case "ForEachEntity": {
				const entityIds = getEntitiesReference(block.entity, localVariables, ecs);
				for (const entityId of entityIds) {
					localVariables[block.variable] = entityId;
					await executeBlocks(ecs, block.triggerBlocks, {
						stepId,
						localVariables,
						executionType,
						callReturnBlocks,
					});
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
				await executeBlocks(ecs, macro.blocks, {
					stepId,
					localVariables,
					theResult,
					executionType,
					callReturnBlocks: block.triggerBlocks,
				});
				break;
			}
			case "TimelineAvailability": {
				if (executionType === "prerequisite") {
					throw new TimelineAvailability(block.isAvailable);
				}
				break;
			}
			case "MacroSlot":
				// Execute the blocks defined by the timeline that called this macro.
				if (!callReturnBlocks)
					throw new Error(
						"Encountered MacroSlot block but no call return blocks are defined. Was this MacroSlot block not inside a macro?",
					);
				await executeBlocks(ecs, callReturnBlocks, {
					stepId,
					localVariables,
					theResult,
					executionType,
				});
				break;
			case "Note": {
				break;
			}
			case "Debug": {
				console.info("Local Variables:");
				console.dir(localVariables);
				if (theResult) {
					console.info("Current Result:");
					console.dir(theResult);
				}
				break;
			}
			default:
				block satisfies never;
				break;
		}
		blockIndex++;
	}
}

function evaluateCondition(
	condition: {
		value1: string;
		value2: string;
		comparison: string;
	},
	localVariables: Record<string, any>,
	ecs: ECS,
) {
	const val1 = getValueReference(condition.value1, localVariables, ecs);
	const val2 = getValueReference(condition.value2, localVariables, ecs);

	switch (condition.comparison) {
		case "=": {
			if (typeof val1 === "boolean") return val1 === Boolean(val2);
			if (typeof val2 === "boolean") return Boolean(val1) === val2;

			// Handle matching entity IDs to entities
			if (val2 instanceof Entity && typeof val1 === "number") return val1 === val2.id;
			if (val1 instanceof Entity && typeof val2 === "number") return val2 === val1.id;
			if (val2 instanceof Entity && typeof val1 === "string") return Number(val1) === val2.id;
			if (val1 instanceof Entity && typeof val2 === "string") return Number(val2) === val1.id;
			if (val1 instanceof Entity && val2 instanceof Entity) return val1.id === val2.id;

			return val1 == val2;
		}
		case "!=": {
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
		case "is not empty": {
			if (typeof val1 === "undefined" || val1 === null) return false;
			if (typeof val1 === "string" || Array.isArray(val1)) return val1.length > 0;
			return true;
		}
		case "is empty": {
			if (typeof val1 === "undefined" || val1 === null) return true;
			if (typeof val1 === "string" || Array.isArray(val1)) return val1.length <= 0;
			return false;
		}
	}
	return false;
}

function getEntitiesReference(ref: string, variables: Record<string, any>, ecs: ECS) {
	const entityIds: number[] = [];
	// Entity Tags
	if (ref.startsWith("#") && !ref.includes(" ")) {
		if (ref === "#playerShip") {
			const playerShips = ecs.componentCache.get("isPlayerShip");
			const shipId = playerShips?.values().next().value?.id;
			if (shipId) {
				entityIds.push(shipId);
			}
		}
		const taggedEntities = ecs.componentCache.get("tags");
		const tag = ref.replace("#", "").trim();
		for (const entity of taggedEntities || []) {
			if (entity.components.tags?.tags.includes(tag)) {
				entityIds.push(entity.id);
			}
		}
	}

	if (ref.startsWith("%")) {
		const [component, property] = ref.trim().slice(1).split(":");
		const entities = ecs.componentCache.get(component as any) || [];

		for (const entity of entities) {
			if (property) {
				const [propName, value] = property.split("=");
				const valueRef = getValueReference(value, variables, ecs);
				// @ts-expect-error
				if (entity.components[component]?.[propName] === valueRef) entityIds.push(entity.id);

				continue;
			}
			entityIds.push(entity.id);
		}
	}

	if (ref.startsWith("$")) {
		const varVal = variables[ref.replace("$", "")];
		if (Array.isArray(varVal)) {
			return varVal.flatMap((v) => (typeof v === "number" ? v : "id" in v ? v.id : []));
		}
		if (typeof varVal === "number") {
			return [varVal];
		}
		if ("id" in varVal) return [varVal.id];
		return [];
	}

	// Entity Names
	const namedEntities = ecs.componentCache.get("identity");
	const name = ref.trim();
	for (const entity of namedEntities || []) {
		if (entity.components.identity?.name === name) {
			entityIds.push(entity.id);
		}
	}
	return entityIds;
}

export function getValueReference(
	ref: string,
	variables: Record<string, any>,
	ecs: ECS,
	notEntity?: boolean,
): any {
	if (typeof ref === "string") {
		// Local variables
		if (ref.startsWith("$")) {
			return getValueReference(variables[ref.replace("$", "")], variables, ecs, notEntity);
		}

		if (!notEntity) {
			const entities = getEntitiesReference(ref, variables, ecs);
			if (entities.length > 0) return entities[0];
		}

		return interpolateText(ref, variables, ecs.rng);
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
	if (typeof ref === "string" && ["this step", "step"].includes(ref.toLowerCase().trim())) {
		throw new Error(
			"Attempted to access a step reference, but that logic should be handled in the function that calls getEntityReference. If you're seeing this message, you've found a bug. Hooray!",
		);
	}
	// Getting the timeline itself
	if (
		!ref ||
		(typeof ref === "string" && ["this timeline", "timeline"].includes(ref.toLowerCase().trim()))
	) {
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

		// Client ID
		for (const entity of ecs.componentCache.get("flightClient") || []) {
			if (entity.components.flightClient?.clientId === ref) return entity;
		}

		// Entity Name
		for (const entity of ecs.componentCache.get("identity") || []) {
			if (entity.components.identity?.name === ref) return entity;
		}
	}

	return null;
}

export async function selectAvailableTimelines<
	T extends {
		prerequisiteBlocks: TimelineBlock[];
		tags: string[];
		flightMode: "nova" | "legacy";
	},
>(ecs: ECS, timelines: T[], flightMode: "nova" | "legacy", variables: Record<string, any>) {
	const availableTimelines = [];
	for (const t of timelines) {
		if (t.flightMode !== flightMode) continue;
		try {
			await executeBlocks(ecs, t.prerequisiteBlocks, {
				localVariables: variables,
				executionType: "prerequisite",
			});
		} catch (error) {
			if (error instanceof TimelineAvailability && error.isAvailable) {
				availableTimelines.push(t);
			}
		}
	}
	return availableTimelines;
}
