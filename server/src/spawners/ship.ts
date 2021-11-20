import {Entity} from "../utils/ecs";
import type ShipPlugin from "../classes/Plugins/Ship";

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
  }
): Entity {
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
      ...(template.toJSON?.().assets || template.assets),
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

  return entity;
}
