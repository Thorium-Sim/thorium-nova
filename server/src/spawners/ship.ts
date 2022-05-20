import {ECS, Entity} from "../utils/ecs";
import type ShipPlugin from "../classes/Plugins/Ship";
import {spawnShipSystem} from "./shipSystem";
import BasePlugin from "../classes/Plugins";

/*
AlertLevelComponent,
ThemeComponent,
InterstellarPositionComponent,
AutopilotComponent,
ShipOutfitsComponent,
*/

interface Coordinates {
  x: number;
  y: number;
  z: number;
}
export function spawnShip(
  template: Partial<ShipPlugin>,
  params: {
    name?: string;
    description?: string;
    registry?: string;
    position: Coordinates;
    tags?: string[];
    assets?: Partial<InstanceType<typeof ShipPlugin>["assets"]>;
  },
  plugins: BasePlugin[]
) {
  const entity = new Entity();

  entity.addComponent("identity", {
    name: params.name || template.name,
    description: template.description,
  });
  entity.addComponent("tags", {
    tags: (template.tags ?? []).concat(params.tags ?? []),
  });
  // TODO November 16, 2021 - write a function to generate registry numbers. Maybe based off the faction.
  entity.addComponent("isShip", {
    category: template.category,
    registry: params.registry || "",
    shipClass: template.name,
    assets: {
      ...template.assets,
      ...params.assets,
    },
  });
  entity.addComponent("position", params.position);
  entity.addComponent("rotation");
  entity.addComponent("velocity");
  entity.addComponent("rotationVelocity");
  // TODO November 16, 2021 - write a function that calculates the width and height
  //  based on the the provided length and the dimensions of the 3D model
  entity.addComponent("size");
  entity.addComponent("mass", {mass: template.mass});

  const shipSystems: Entity[] = [];
  entity.addComponent("shipSystems");
  template.shipSystems?.forEach(system => {
    const plugin = plugins.find(plugin => system.pluginId === plugin.id);
    const systemPlugin = plugin?.aspects.shipSystems.find(
      sys => sys.name === system.systemId
    );
    if (!systemPlugin) return;
    const systemEntity = spawnShipSystem(systemPlugin, system.overrides);
    shipSystems.push(systemEntity);
    entity.updateComponent("shipSystems", {
      shipSystemIds: [
        ...(entity.components.shipSystems?.shipSystemIds || []),
        systemEntity.id,
      ],
    });
  });
  return {ship: entity, shipSystems};
}
