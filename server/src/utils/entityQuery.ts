import {ComponentProperties} from "@server/components";
import {Component, ECS, Entity} from "./ecs";

type FilterValue<
  T extends string | number | boolean | (string | number | boolean)[]
> = T | QueryParams;

type FilterOperators = {
  eq?: FilterValue<string | number | boolean>;
  neq?: FilterValue<string | number | boolean>;
  lt?: FilterValue<number>;
  lte?: FilterValue<number>;
  gt?: FilterValue<number>;
  gte?: FilterValue<number>;
  in?: FilterValue<(string | number | boolean)[]>;
  nin?: FilterValue<(string | number | boolean)[]>;
  null?: FilterValue<boolean>;
  nnull?: FilterValue<boolean>;
  contains?: FilterValue<string>;
  icontains?: FilterValue<string>;
  ncontains?: FilterValue<string>;
  starts_with?: FilterValue<string>;
  istarts_with?: FilterValue<string>;
  nstarts_with?: FilterValue<string>;
  nistarts_with?: FilterValue<string>;
  ends_with?: FilterValue<string>;
  iends_with?: FilterValue<string>;
  nends_with?: FilterValue<string>;
  niends_with?: FilterValue<string>;
  // _between?: [FilterValue<number>, FilterValue<number>];
  // _nbetween?: [FilterValue<number>, FilterValue<number>];
};

type FilterParams = {
  id?: number;
} & {
  [P in keyof ComponentProperties]?: {
    [K in keyof ComponentProperties[P]]?: FilterOperators;
  };
};

type SelectOperator = {
  [P in keyof ComponentProperties]?: {
    [K in keyof ComponentProperties[P]]?: boolean;
  };
};

type QueryParams = {filter: FilterParams; select?: SelectOperator};

function resolveOperator<
  O extends keyof FilterOperators,
  V extends FilterOperators[O]
>(ecs: ECS, value: V, operator: O) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  let newValue = entityQuery(ecs, value);
  if (newValue[0] && newValue[0].id) newValue = newValue.map(e => e.id);
  if (operator === "in" || operator === "nin") return newValue;
  return newValue[0];
}

export function entityQuery(ecs: ECS, {filter, select}: QueryParams): any[] {
  const output: Entity[] = [];
  for (let entity of ecs.entities) {
    if (entity.id === filter.id) output.push(entitySelect(entity, select));
    for (let c in filter) {
      let component = c as keyof FilterParams;
      if (component === "id") continue;
      if (entity.components[component]) {
        let componentData = entity.components[component];
        const componentParams = filter[component];
        if (!componentParams || !componentData) continue;
        let matches = true;
        for (let K in componentParams) {
          let key = K as keyof FilterParams[typeof component];
          let operator = componentParams[key] as FilterOperators;
          let value = componentData[key] as any;
          if (operator.eq) {
            if (value !== resolveOperator(ecs, operator.eq, "eq"))
              matches = false;
          }
          if (operator.neq) {
            if (value === resolveOperator(ecs, operator.neq, "neq"))
              matches = false;
          }
          if (operator.lt) {
            if (value >= resolveOperator(ecs, operator.lt, "lt"))
              matches = false;
          }
          if (operator.lte) {
            if (value > resolveOperator(ecs, operator.lte, "lte"))
              matches = false;
          }
          if (operator.gt) {
            if (value <= resolveOperator(ecs, operator.gt, "gt"))
              matches = false;
          }
          if (operator.gte) {
            if (value < resolveOperator(ecs, operator.gte, "gte"))
              matches = false;
          }
          if (operator.in) {
            if (!resolveOperator(ecs, operator.in, "in").includes(value))
              matches = false;
          }
          if (operator.nin) {
            if (resolveOperator(ecs, operator.nin, "nin").includes(value))
              matches = false;
          }
          if (operator.null) {
            if (value !== null) matches = false;
          }
          if (operator.nnull) {
            if (value === null) matches = false;
          }

          if (typeof value === "string" || Array.isArray(value)) {
            if (operator.contains) {
              if (
                !value.includes(
                  resolveOperator(ecs, operator.contains, "contains")
                )
              )
                matches = false;
            }
            if (operator.icontains && typeof value === "string") {
              if (
                !value
                  .toLowerCase()
                  .includes(
                    resolveOperator(
                      ecs,
                      operator.icontains,
                      "icontains"
                    ).toLowerCase()
                  )
              )
                matches = false;
            }
            if (operator.ncontains) {
              if (
                value.includes(
                  resolveOperator(ecs, operator.ncontains, "ncontains")
                )
              )
                matches = false;
            }
            if (operator.starts_with && typeof value === "string") {
              if (
                !value.startsWith(
                  resolveOperator(ecs, operator.starts_with, "starts_with")
                )
              )
                matches = false;
            }
            if (operator.istarts_with && typeof value === "string") {
              if (
                !value
                  .toLowerCase()
                  .startsWith(
                    resolveOperator(
                      ecs,
                      operator.istarts_with,
                      "istarts_with"
                    ).toLowerCase()
                  )
              )
                matches = false;
            }
            if (operator.nstarts_with && typeof value === "string") {
              if (
                value.startsWith(
                  resolveOperator(ecs, operator.nstarts_with, "nstarts_with")
                )
              )
                matches = false;
            }
            if (operator.nistarts_with && typeof value === "string") {
              if (
                value
                  .toLowerCase()
                  .startsWith(
                    resolveOperator(
                      ecs,
                      operator.nistarts_with,
                      "nistarts_with"
                    ).toLowerCase()
                  )
              )
                matches = false;
            }

            if (operator.ends_with && typeof value === "string") {
              if (
                !value.endsWith(
                  resolveOperator(ecs, operator.ends_with, "ends_with")
                )
              )
                matches = false;
            }
            if (operator.iends_with && typeof value === "string") {
              if (
                !value
                  .toLowerCase()
                  .endsWith(
                    resolveOperator(
                      ecs,
                      operator.iends_with,
                      "iends_with"
                    ).toLowerCase()
                  )
              )
                matches = false;
            }
            if (operator.nends_with && typeof value === "string") {
              if (
                value.endsWith(
                  resolveOperator(ecs, operator.nends_with, "nends_with")
                )
              )
                matches = false;
            }
            if (operator.niends_with && typeof value === "string") {
              if (
                value
                  .toLowerCase()
                  .endsWith(
                    resolveOperator(
                      ecs,
                      operator.niends_with,
                      "niends_with"
                    ).toLowerCase()
                  )
              )
                matches = false;
            }
          }

          // if (typeof value === "number") {
          //   if (operator._between) {
          //     if (value < operator._between[0] || value > operator._between[1])
          //       matches = false;
          //   }

          //   if (operator._nbetween) {
          //     if (
          //       value >= operator._nbetween[0] &&
          //       value <= operator._nbetween[1]
          //     )
          //       matches = false;
          //   }
          // }
        }
        if (matches) output.push(entitySelect(entity, select));
      }
    }
  }
  return output;
}

export function entitySelect<T extends SelectOperator>(
  entity: Entity,
  properties?: T
): any {
  if (!properties) return entity;
  const data = {id: entity.id, ...entity.components};
  const output = recursiveGetValue(data, properties);
  return output;
}

function recursiveGetValue(obj: any, properties: any): any {
  let output: any;
  if (Array.isArray(obj)) {
    output = [];
    for (let item of obj) {
      output.push(recursiveGetValue(item, properties));
    }
    return output;
  }
  if (typeof obj !== "object") {
    return obj;
  }
  const keys = Object.keys(properties);
  if (keys.length === 0) {
    return {...obj};
  }
  let key = keys[0];
  if (properties[key]) return recursiveGetValue(obj[key], properties[key]);
}
