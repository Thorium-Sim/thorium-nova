import {Entity} from "@server/utils/ecs";
import {spawnShipSystem} from "@server/spawners/shipSystem";
import type BaseShipSystemPlugin from "./BaseSystem";

export function makeSystemEntities(
  system: BaseShipSystemPlugin,
  overrides?: Record<string, any>
): Entity[] {
  return [spawnShipSystem(system, overrides)];
}
