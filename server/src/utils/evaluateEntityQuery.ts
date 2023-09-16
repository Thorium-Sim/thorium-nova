/* eslint-disable eqeqeq */
import {
  ComponentQuery,
  EntityQuery,
  ValueQuery,
} from "@server/classes/Plugins/Timeline";
import {ECS, Entity} from "./ecs";
import {actionItem, actionSchema, conditionSchema} from "./actionSchema";
import {getNavigationDistance} from "./getNavigationDistance";
import {lightMinuteToKilometer, lightYearToLightMinute} from "./unitTypes";
import {
  getCompletePositionFromOrbit,
  getObjectSystem,
} from "@client/cards/Navigation/data";
import {callProcedure} from "@thorium/live-query/server/router";
import {router} from "@server/init/router";
import {DataContext} from "./DataContext";
import {database} from "@server/init/buildDatabase";

export function evaluateEntityQuery(ecs: ECS, query: EntityQuery): Entity[] {
  const output: Entity[] = [];
  const entitySet = new Set<Entity>();
  for (let componentQuery of query) {
    const entities = ecs.componentCache.get(componentQuery.component);
    if (!entities) continue;
    for (let entity of entities) {
      entitySet.add(entity);
    }
  }
  for (let entity of entitySet) {
    let match = true;
    for (let componentQuery of query) {
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

function evaluateComponentQuery(
  ecs: ECS,
  entity: Entity,
  componentQuery: ComponentQuery
) {
  if (
    !componentQuery ||
    !componentQuery.component ||
    !componentQuery.property
  ) {
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
        })
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
      .map(e =>
        // @ts-expect-error
        entityQuery.select.component === "id"
          ? e.id
          : // @ts-expect-error
            e.components[entityQuery.select.component]?.[
              entityQuery.select.property
            ]
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
  conditions: Zod.infer<typeof conditionSchema>[],
  event?: {event: string; values: any}
) {
  let match = true;
  for (let condition of conditions) {
    if (condition.type === "eventListener") {
      if (event?.event === condition.event) {
        // Check arg values
        if (condition.values) {
          for (let key in condition.values) {
            let conditionValue = condition.values[key];
            if (
              typeof conditionValue === "object" &&
              "query" in conditionValue &&
              typeof conditionValue.query === "object" &&
              "select" in conditionValue
            ) {
              conditionValue = selectValueQuery(ecs, conditionValue as any);
              if (conditionValue.length === 0) return false;
              let conditionMatch = false;
              for (let value of conditionValue) {
                if (event.values[key] === value) {
                  conditionMatch = true;
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
      } else {
        match = false;
        break;
      }
    }
    if (condition.type === "distance") {
      const entityA = evaluateEntityQuery(ecs, condition.entityA as any);
      const entityB = evaluateEntityQuery(ecs, condition.entityB as any);
      if (entityA.length === 0 || entityB.length === 0) {
        match = false;
        break;
      }
      const distance = getEntityDistance(entityA, entityB, condition.condition);
      console.log(distance, condition.distance);
      if (condition.condition === "lessThan") {
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
      if (condition.matchCount === ">=1") {
        if (entities.length < 1) {
          match = false;
          break;
        }
      } else if (condition.matchCount === "0" && entities.length !== 0) {
        match = false;
        break;
      } else {
        const matchCount = parseInt(condition.matchCount);
        if (entities.length !== matchCount) {
          match = false;
          break;
        }
      }
    }
  }
  return match;
}

function getEntityDistance(
  entityA: Entity[],
  entityB: Entity[],
  condition: "lessThan" | "greaterThan"
) {
  // Calculate positions
  const positionsA = entityA.map(getEntityPosition).filter(Boolean);
  const positionsB = entityB.map(getEntityPosition).filter(Boolean);

  let distances: number[] = [];
  for (let a of positionsA) {
    for (let b of positionsB) {
      if (!a || !b) continue;
      if (
        (a.type === "ship" && b.type !== "ship") ||
        (a.type !== "ship" && b.type === "ship")
      )
        continue;
      if (
        a.type === "ship" &&
        b.type === "ship" &&
        a.parentObject !== b.parentObject
      )
        continue;
      let distance = 0;
      if (a.type === "ship" && b.type === "ship") {
        distance = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      } else {
        const distanceOutput = getNavigationDistance(
          a,
          b,
          a.parentObject,
          b.parentObject
        );
        if (!distanceOutput) continue;
        distance =
          distanceOutput.unit === "LY"
            ? lightMinuteToKilometer(
                lightYearToLightMinute(distanceOutput.distance)
              )
            : distanceOutput.distance;
      }
      distances.push(distance);
    }
  }

  if (condition === "lessThan") {
    return Math.min(...distances);
  } else {
    return Math.max(...distances);
  }
}

function getEntityPosition(e: Entity) {
  if (e.components.position) {
    let parentObject = null;
    const {x, y, z, type} = e.components.position;
    if (e.components.position.type === "solar") {
      parentObject = getObjectSystem(e);
    }
    if (
      e.components.position.type === "ship" &&
      e.components.position.parentId
    ) {
      parentObject =
        e.ecs?.getEntityById(e.components.position.parentId) || null;
    }
    let parentPosition:
      | {id: number; x: number; y: number; z: number}
      | null
      | undefined = parentObject?.components.position
      ? {id: parentObject.id, ...parentObject.components.position}
      : null;
    if (parentObject && !parentPosition) {
      parentPosition = parentObject
        ? {id: parentObject.id, ...getCompletePositionFromOrbit(parentObject)}
        : null;
    }
    return {x, y, z, type, parentObject: parentPosition};
  }
  if (e.components.satellite) {
    const {x, y, z} = getCompletePositionFromOrbit(e);
    const parentObject = getObjectSystem(e);
    let parentPosition:
      | {id: number; x: number; y: number; z: number}
      | null
      | undefined = parentObject?.components.position
      ? {id: parentObject.id, ...parentObject.components.position}
      : null;
    if (parentObject && !parentPosition) {
      parentPosition = parentObject
        ? {id: parentObject.id, ...getCompletePositionFromOrbit(parentObject)}
        : null;
    }

    return {type: "solar", x, y, z, parentObject: parentPosition};
  }
  return null;
}

// Action evaluator and executor.
export function evaluateAction(ecs: ECS, action: Zod.infer<typeof actionItem>) {
  // Based on the results of the entity queries, we might execute this
  // action multiple times with different values.
  const actionValues: Map<string, Set<any>> = new Map();
  for (let [name, value] of Object.entries(action.values)) {
    if (!actionValues.get(name)) actionValues.set(name, new Set());
    if (typeof value === "object" && "query" in value) {
      const values = selectValueQuery(ecs, value as any);
      for (let v of values) {
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
      const updated = {...current};
      updated[key] = value;
      permute(index + 1, updated);
    }
  }

  permute(0, {});

  return permutations;
}

export async function executeActions(
  context: DataContext,
  actions: Zod.infer<typeof actionSchema>,
  stepId?: number
) {
  if (!context.flight) return;
  for (let action of actions) {
    const values = evaluateAction(context.flight.ecs, action);
    for (let value of values) {
      try {
        // This await is mostly so we can do a delay action
        if (action.action === "triggers.create") {
          value.stepId = stepId;
        }
        await triggerSend(action.action, value, context);
      } catch (error) {
        console.error("Error executing action:", action.action, error);
      }
    }
  }
}

export function triggerStep(step: Entity) {
  const actions = step?.components.isTimelineStep?.actions;
  if (!actions) return;
  const context = new DataContext("thorium", database);
  executeActions(context, actions, step.id);
}

export async function processTriggers(
  ecs: ECS,
  event?: {event: string; values: any}
) {
  const triggers = ecs.componentCache.get("isTrigger");
  if (!triggers) return;
  await Promise.all(
    Array.from(triggers).map(async trigger => {
      if (!trigger.components.isTrigger || !trigger.components.isTrigger.active)
        return false;
      const {conditions, actions, stepId} = trigger.components.isTrigger;
      const match = evaluateTriggerCondition(ecs, conditions, event);
      if (match) {
        await executeActions(
          new DataContext("thorium", database),
          actions.map(action => {
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
          })
        );
        trigger.updateComponent("isTrigger", {
          triggeredAt: new Date(),
          active: false,
        });
      }
    })
  );
}

export async function triggerSend(path: string, input: any, ctx?: DataContext) {
  const context = ctx || new DataContext("thorium", database);

  await callProcedure({
    procedures: router._def.procedures,
    type: "send",
    path: path,
    rawInput: input,
    ctx: context,
    onCall: opts => {
      const ecs = ctx?.flight?.ecs;
      if (!ecs || opts.type !== "send") return;

      processTriggers(ecs, {
        event: opts.path,
        values: {
          shipId: ctx.ship?.id,
          clientId: ctx.client.id,
          ...(opts.rawInput as any),
        },
      });
    },
  });
}
