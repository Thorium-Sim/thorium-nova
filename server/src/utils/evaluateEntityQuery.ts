/* eslint-disable eqeqeq */
import {
  ComponentQuery,
  EntityQuery,
  ValueQuery,
} from "@server/classes/Plugins/Timeline";
import {ECS, Entity} from "./ecs";
import {conditionSchema} from "./actionSchema";
import {position} from "@server/components/position";
import {getOrbitPosition} from "./getOrbitPosition";
import {getNavigationDistance} from "./getNavigationDistance";
import {lightMinuteToKilometer, lightYearToLightMinute} from "./unitTypes";
import {
  getCompletePositionFromOrbit,
  getObjectSystem,
} from "@client/cards/Navigation/data";

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
            if (event.values[key] != condition.values[key]) {
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
      if (entityA.length === 0 || entityB.length === 0) return false;
      const distance = getEntityDistance(entityA, entityB, condition.condition);
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
