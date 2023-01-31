import type BaseShipSystemPlugin from "../classes/Plugins/ShipSystems/BaseSystem";
import {ShipSystemTypes} from "../classes/Plugins/ShipSystems/shipSystemTypes";
import {components, ComponentIDs} from "../components";
import {Entity} from "../utils/ecs";
import {mergeDeep} from "../utils/mergeDeep";

export function spawnShipSystem(
  systemPlugin: Partial<BaseShipSystemPlugin>,
  overrides: Record<string, any> = {}
) {
  const entity = new Entity();
  const template = mergeDeep(systemPlugin, overrides);

  entity.addComponent("identity", {
    name: template.name,
    description: template.description,
  });
  entity.addComponent("tags", {tags: template.tags});

  if (template.type) {
    entity.addComponent("isShipSystem", {type: template.type});

    const componentName =
      `is${template.type[0].toUpperCase()}${template.type.slice(
        1
      )}` as `is${Capitalize<typeof template.type>}`;

    const flags = ShipSystemTypes[template.type].flags;

    if (
      template.type !== "generic" &&
      Object.values(components).some(
        c => template.type && c.id === componentName
      )
    )
      entity.addComponent(componentName as ComponentIDs, template);

    const {
      coolantHeatTransferRate,
      heatDissipationRate,
      maxHeat,
      maxSafeHeat,
      nominalHeat,
      requiredPower,
      defaultPower,
      maxSafePower,
    } = systemPlugin;
    if (flags.includes("heat"))
      entity.addComponent("heat", {
        coolantHeatTransferRate:
          overrides.coolantHeatTransferRate || coolantHeatTransferRate,
        heatDissipationRate:
          overrides.heatDissipationRate || heatDissipationRate,
        maxHeat: overrides.maxHeat || maxHeat,
        maxSafeHeat: overrides.maxSafeHeat || maxSafeHeat,
        nominalHeat: overrides.nominalHeat || nominalHeat,
        heat: overrides.nominalHeat || nominalHeat,
      });
    if (flags.includes("power"))
      entity.addComponent("power", {
        requiredPower: overrides.requiredPower || requiredPower,
        defaultPower: overrides.defaultPower || defaultPower,
        maxSafePower: overrides.maxSafePower || maxSafePower,
      });
    if (flags.includes("efficiency")) entity.addComponent("efficiency");
  }

  return entity;
}
