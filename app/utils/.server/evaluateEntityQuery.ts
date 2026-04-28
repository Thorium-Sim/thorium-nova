/* eslint-disable eqeqeq */
import type {
	ComponentQuery,
	EntityQuery,
	ValueQuery,
} from "@thorium/.server/classes/Plugins/TimelineStep";
import { pubsub } from "@thorium/.server/init/pubsub";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { interpolateText } from "@thorium/utils/interpolationEngine";
import type z from "zod";

import type { ECS, Entity } from "../ecs";
import type { actionItem, conditionSchema } from "../flags/actionSchema";
import { getNavigationDistance } from "../starmap/getNavigationDistance";
import { getCompletePositionFromOrbit, getObjectSystem } from "../starmap/position";
import { lightMinuteToKilometer, lightYearToLightMinute } from "../unitTypes";

export function evaluateEntityQuery(ecs: ECS, query: EntityQuery): Entity[] {
	const output: Entity[] = [];
	const entitySet = new Set<Entity>();
	for (const componentQuery of query) {
		const entities = ecs.componentCache.get(componentQuery.component as any);
		if (!entities) continue;
		for (const entity of entities) {
			entitySet.add(entity);
		}
	}
	for (const entity of entitySet) {
		let match = true;
		for (const componentQuery of query) {
			const evaluation = evaluateComponentQuery(ecs, entity, componentQuery);
			if (evaluation == undefined) continue;
			match = evaluation;
			if (!match) break;
		}
		if (match) {
			output.push(entity);
		}
	}
	return output;
}

function evaluateComponentQuery(ecs: ECS, entity: Entity, componentQuery: ComponentQuery) {
	if (!componentQuery || !componentQuery.component || !componentQuery.property) {
		// Ignore it if it's undefined
		return;
	}
	const component = entity.components[componentQuery.component];
	// This is the only case where we allow the component to not exist
	if (componentQuery.property === "isNotPresent" && !component) {
		return;
	}
	if (!component) {
		return false;
	}
	if (componentQuery.property === "isPresent") {
		return;
	}
	// @ts-expect-error
	const property = component[componentQuery.property];
	let value: any = componentQuery.value;
	if (typeof value === "object" && "query" in value) {
		value = selectValueQuery(ecs, value);
		if (value.length === 0) {
			return false;
		}
		if (value.length === 1) {
			value = value[0];
		} else {
			// When there are multiple values, we just check and see if any of them evaluate
			return value.some((v: any) =>
				evaluateComponentQuery(ecs, entity, {
					...componentQuery,
					value: v,
				}),
			);
		}
	}

	// Use double equals to coerce values
	if (componentQuery.comparison) {
		if (componentQuery.comparison === "contains") {
			if (property.includes(value)) {
				return true;
			}
		}
		if (componentQuery.comparison === "length") {
			if (property.length == value) {
				return true;
			}
		}
		if (componentQuery.comparison === "true") {
			if (property === true) {
				return true;
			}
		}
		if (componentQuery.comparison === "false") {
			if (property === false) {
				return true;
			}
		}
		if (componentQuery.comparison === "=") {
			if (property == value) {
				return true;
			}
		} else if (componentQuery.comparison === "!=") {
			if (property != value) {
				return true;
			}
		} else if (componentQuery.comparison === ">") {
			if (property > value) {
				return true;
			}
		} else if (componentQuery.comparison === "<") {
			if (property < value) {
				return true;
			}
		} else if (componentQuery.comparison === ">=") {
			if (property >= value) {
				return true;
			}
		} else if (componentQuery.comparison === "<=") {
			if (property <= value) {
				return true;
			}
		} else if (componentQuery.comparison === "is empty") {
			if (!property || (Array.isArray(property) && property.length === 0)) {
				return true;
			}
		} else if (componentQuery.comparison === "is not empty") {
			if (!property || (Array.isArray(property) && property.length === 0)) {
			} else {
				return true;
			}
		}
	} else {
		if (property == value) {
			return true;
		}
	}
	return false;
}

export function selectValueQuery(ecs: ECS, entityQuery: ValueQuery): any[] {
	const entities = evaluateEntityQuery(ecs, entityQuery.query);
	if (entities.length === 0) return [];
	if (entityQuery.select) {
		const values = entities
			.map((e) =>
				// @ts-expect-error
				entityQuery.select.component === "id"
					? e.id
					: // @ts-expect-error
						e.components[entityQuery.select.component]?.[entityQuery.select.property],
			)
			.filter((t: any) => t !== undefined);

		if (entityQuery.select.matchType === "all") {
			return values;
		}
		if (entityQuery.select.matchType === "first") {
			return [values[0]];
		}
		if (entityQuery.select.matchType === "random") {
			return [values[Math.floor(Math.random() * entities.length)]];
		}
	}
	return [];
}

export function evaluateTriggerCondition(
	ecs: ECS,
	conditions: z.infer<typeof conditionSchema>[],
	event?: { event: string; values: any },
) {
	let match: any = true;
	for (const condition of conditions) {
		if (condition.type === "eventListener") {
			if (event?.event === condition.event) {
				// Check arg values
				if (condition.values) {
					for (const key in condition.values) {
						let conditionValue = condition.values[key];

						if (
							conditionValue &&
							typeof conditionValue === "object" &&
							"query" in conditionValue &&
							typeof conditionValue.query === "object" &&
							"select" in conditionValue
						) {
							conditionValue = selectValueQuery(ecs, conditionValue as any);
							if (conditionValue.length === 0) return false;
							let conditionMatch = false;
							for (const value of conditionValue) {
								if (event.values[key] === value) {
									conditionMatch = event.values;
									break;
								}
							}
							if (!conditionMatch) {
								match = false;
								break;
							}
						} else if (event.values[key] != conditionValue) {
							match = false;
							break;
						}
					}
				}
				if (match) {
					match = event.values;
				}
			} else {
				match = false;
				break;
			}
		}
		if (condition.type === "distance") {
			const entityA = ecs.getEntityById(condition.entityA);
			const entityB = ecs.getEntityById(condition.entityB);
			if (!entityA || !entityB) {
				match = false;
				break;
			}
			const distance = getEntityDistance([entityA], [entityB], condition.condition);
			if (condition.condition === "less than") {
				if (distance > condition.distance) {
					match = false;
					break;
				}
			} else {
				if (distance < condition.distance) {
					match = false;
					break;
				}
			}
		}
		if (condition.type === "entityMatch") {
			const entities = evaluateEntityQuery(ecs, condition.query as any);
			if (condition.matchCount === "any") {
				if (entities.length < 1) {
					match = false;
					break;
				}
				match = entities;
			} else if (condition.matchCount === "no" && entities.length !== 0) {
				match = false;
				break;
			} else if (condition.matchCount === "one") {
				if (entities.length !== 1) {
					match = false;
					break;
				}
				match = entities[0];
			}
		}
	}
	return match;
}

function getEntityDistance(
	entityA: Entity[],
	entityB: Entity[],
	condition: "less than" | "more than",
) {
	// Calculate positions
	const positionsA = entityA.map(getEntityPosition).filter(Boolean);
	const positionsB = entityB.map(getEntityPosition).filter(Boolean);

	const distances: number[] = [];
	for (const a of positionsA) {
		for (const b of positionsB) {
			if (!a || !b) continue;
			if ((a.type === "ship" && b.type !== "ship") || (a.type !== "ship" && b.type === "ship"))
				continue;
			if (a.type === "ship" && b.type === "ship" && a.parentObject !== b.parentObject) continue;
			let distance = 0;
			if (a.type === "ship" && b.type === "ship") {
				distance = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
			} else {
				const distanceOutput = getNavigationDistance(a, b, a.parentObject, b.parentObject);
				if (!distanceOutput) continue;
				distance =
					distanceOutput.unit === "LY"
						? lightMinuteToKilometer(lightYearToLightMinute(distanceOutput.distance))
						: distanceOutput.distance;
			}
			distances.push(distance);
		}
	}

	if (condition === "less than") {
		return Math.min(...distances);
	}
	return Math.max(...distances);
}

function getEntityPosition(e: Entity) {
	if (e.components.position) {
		let parentObject = null;
		const { x, y, z, type } = e.components.position;
		if (e.components.position.type === "solar") {
			parentObject = getObjectSystem(e);
		}
		if (e.components.position.type === "ship" && e.components.position.parentId) {
			parentObject = e.ecs?.getEntityById(e.components.position.parentId) || null;
		}
		let parentPosition: { id: number; x: number; y: number; z: number } | null | undefined =
			parentObject?.components.position
				? { id: parentObject.id, ...parentObject.components.position }
				: null;
		if (parentObject && !parentPosition) {
			parentPosition = parentObject
				? { id: parentObject.id, ...getCompletePositionFromOrbit(parentObject) }
				: null;
		}
		return { x, y, z, type, parentObject: parentPosition };
	}
	if (e.components.satellite) {
		const { x, y, z } = getCompletePositionFromOrbit(e);
		const parentObject = getObjectSystem(e);
		let parentPosition: { id: number; x: number; y: number; z: number } | null | undefined =
			parentObject?.components.position
				? { id: parentObject.id, ...parentObject.components.position }
				: null;
		if (parentObject && !parentPosition) {
			parentPosition = parentObject
				? { id: parentObject.id, ...getCompletePositionFromOrbit(parentObject) }
				: null;
		}

		return { type: "solar", x, y, z, parentObject: parentPosition };
	}
	return null;
}

// Action evaluator and executor.
export function evaluateAction(ecs: ECS, action: z.infer<typeof actionItem>) {
	// Based on the results of the entity queries, we might execute this
	// action multiple times with different values.
	const actionValues: Map<string, Set<any>> = new Map();
	for (const [name, value] of Object.entries(action.values)) {
		if (!actionValues.get(name)) actionValues.set(name, new Set());
		if (typeof value === "object" && "query" in value) {
			const values = selectValueQuery(ecs, value as any);
			for (const v of values) {
				actionValues.get(name)?.add(v);
			}
		} else {
			actionValues.get(name)?.add(value);
		}
	}
	// Generate every permutation of the values
	const values: any[] = generatePermutations(actionValues);

	return values;
}

function generatePermutations(inputMap: Map<string, Set<any>>) {
	const keys = Array.from(inputMap.keys());
	const permutations: any[] = [];

	function permute(index: number, current: any) {
		if (index === keys.length) {
			permutations.push(current);
			return;
		}

		const key = keys[index];
		const valueSet = inputMap.get(key);
		if (!valueSet) return;
		for (const value of valueSet) {
			const updated = { ...current };
			updated[key] = value;
			permute(index + 1, updated);
		}
	}

	permute(0, {});

	return permutations;
}

export async function triggerStep(step: Entity) {
	const timeline = step.ecs.getEntityById(step.components.isTimelineStep?.timelineId || -1);
	const localVariables =
		timeline?.components.variables?.variables.reduce((prev: Record<string, any>, next) => {
			prev[next.name] = next.value;
			return prev;
		}, {}) || {};

	const blocks = step?.components.isTimelineStep?.blocks;
	if (!blocks) return;
	step.updateComponent("isTimelineStep", { state: "executing" });
	await executeBlocks(step.ecs, blocks, { stepId: step.id, localVariables });
	step.updateComponent("identity", {
		description: interpolateText(
			step.components.identity?.description || "",
			localVariables,
			step.ecs.rng,
		),
	});
	// If there are no triggers associated with this timeline step, then we can consider it executed
	let hasTrigger = false;

	for (const entity of step.ecs.componentCache.get("isTrigger") || []) {
		if (
			entity.components.isTrigger?.stepId === step.id &&
			entity.components.isTrigger.triggeredAt === null
		) {
			hasTrigger = true;
			break;
		}
	}

	if (!hasTrigger) {
		step.updateComponent("isTimelineStep", { state: "executed" });
	}

	if (timeline?.components.isTimeline?.type === "report") {
		pubsub.publish.damageReports.damageReports({
			shipId: timeline?.components.isTimeline?.shipId || -1,
		});
	}
}

export async function processTriggers(ecs: ECS, event?: { event: string; values: any }) {
	const triggers = [...(ecs.componentCache.get("isTrigger") || [])];
	if (!triggers) return;
	for (const trigger of triggers) {
		if (!trigger.components.isTrigger || !trigger.components.isTrigger.active) continue;
		const { conditions, blocks, stepId, localVariables, callReturnBlocks } =
			trigger.components.isTrigger;
		const match = evaluateTriggerCondition(ecs, conditions, event);
		if (match) {
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
			trigger.updateComponent("isTrigger", {
				triggeredAt: new Date(),
				...(trigger.components.isTrigger.multiple ? {} : { active: false }),
			});
		}
	}
}
