import {ECS, Entity} from "../utils/ecs";
import type ShipPlugin from "../classes/Plugins/Ship";
import {spawnShipSystem} from "./shipSystem";
import BasePlugin from "../classes/Plugins";
import {PositionComponent} from "../components/position";
import {randomFromList} from "../utils/randomFromList";

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
    position: Omit<PositionComponent, "init">;
    tags?: string[];
    assets?: Partial<InstanceType<typeof ShipPlugin>["assets"]>;
    playerShip?: boolean;
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
  if (params.playerShip) {
    entity.addComponent("isPlayerShip");
  }
  let extraEntities: Entity[] = [];
  // Initialize the ship map. For now, we'll just load the ship map onto a component of the ship.
  // In the future, rooms themselves might become entities.
  if (entity.components.isPlayerShip) {
    const deckNodes =
      template.decks?.flatMap((deck, i) =>
        deck.nodes.map(n => ({...n, deckIndex: i}))
      ) || [];

    entity.addComponent("shipMap", {
      decks: template.decks || [],
      deckNodes,
      deckEdges: template.deckEdges || [],
    });
    deckNodes.forEach(node => {
      if (!node.isRoom) return;
      const room = new Entity();
      room.addComponent("isRoom", {});
      room.addComponent("cargoContainer", {volume: node.volume});
      extraEntities.push(room);
    });
    // Place cargo containers
    Array.from({length: template.cargoContainers || 0}).forEach(() => {
      // TODO June 24, 2022: Maybe make this use the ECS PRNG
      const randomRoom = randomFromList(deckNodes.filter(n => n.isRoom));
      if (!randomRoom) return;
      const cargoContainer = new Entity();
      cargoContainer.addComponent("cargoContainer", {
        volume: template.cargoContainerVolume || 1,
      });
      cargoContainer.addComponent("position", {
        x: randomRoom.x,
        y: randomRoom.y,
        z: randomRoom.deckIndex,
        type: "ship",
        parentId: entity.id,
      });
      cargoContainer.addComponent("passengerMovement", {});
      extraEntities.push(cargoContainer);
    });
  } else {
    // Give the ship some cargo space without creating any rooms
    entity.addComponent("cargoContainer", {
      // TODO June 24, 2022: Make this a configurable value
      volume: 500,
    });
  }
  return {ship: entity, extraEntities: shipSystems.concat(extraEntities)};
}
