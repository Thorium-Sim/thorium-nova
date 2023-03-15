import {ECS, Entity} from "../utils/ecs";
import type ShipPlugin from "../classes/Plugins/Ship";
import {PositionComponent} from "../components/position";
import {randomFromList} from "../utils/randomFromList";
import {generateShipInventory} from "./inventory";
import {FlightDataModel} from "../classes/FlightDataModel";
import {ServerDataModel} from "../classes/ServerDataModel";
import {greekLetters} from "../utils/constantStrings";
import {spawnShipSystem} from "./shipSystem";
import ReactorPlugin from "@server/classes/Plugins/ShipSystems/Reactor";
import BaseShipSystemPlugin from "@server/classes/Plugins/ShipSystems/BaseSystem";
import {getInventoryTemplates} from "@server/utils/getInventoryTemplates";
import {battery} from "@client/pages/Config/data/systems/battery";

const systemCache: Record<string, BaseShipSystemPlugin> = {};
function getSystem(
  dataContext: {flight: FlightDataModel | null; server: ServerDataModel},
  systemId: string,
  pluginId: string
) {
  if (!systemCache[`${systemId}-${pluginId}`]) {
    const plugin = dataContext.server.plugins.find(
      plugin => pluginId === plugin.id
    );
    const systemPlugin = plugin?.aspects.shipSystems.find(
      sys => sys.name === systemId
    );
    if (!systemPlugin) return undefined;
    systemCache[`${systemId}-${pluginId}`] = systemPlugin;
  }
  return systemCache[`${systemId}-${pluginId}`];
}
export function spawnShip(
  dataContext: {flight: FlightDataModel | null; server: ServerDataModel},
  template: Partial<ShipPlugin>,
  params: {
    name?: string;
    description?: string;
    registry?: string;
    position: Omit<PositionComponent, "init">;
    tags?: string[];
    assets?: Partial<InstanceType<typeof ShipPlugin>["assets"]>;
    playerShip?: boolean;
  }
) {
  if (!dataContext.flight) throw new Error("No flight has been started.");
  const inventoryTemplates = getInventoryTemplates(dataContext.flight?.ecs);

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

  entity.addComponent("shipSystems");

  let systemEntities: Entity[] = [];
  // First we'll create some power nodes
  const powerNodes: Record<string, {entity: Entity; count: number}> = {};
  template.powerNodes?.forEach(name => {
    const node = new Entity();
    node.addComponent("identity", {name});
    node.addComponent("isPowerNode", {
      maxConnections: 3,
      connectedSystems: [],
      distributionMode: "evenly",
    });
    powerNodes[name] = {entity: node, count: 0};
    systemEntities.push(node);
  });

  template.shipSystems?.forEach(system => {
    const systemPlugin = getSystem(
      dataContext,
      system.systemId,
      system.pluginId
    );
    if (!systemPlugin) return;
    switch (systemPlugin.type) {
      case "reactor":
        // Reactors are special, so take care of them later.

        break;
      case "battery": {
        const entity = spawnShipSystem(systemPlugin, system.overrides);
        if (entity.components.isBattery) {
          entity.components.isBattery.storage =
            entity.components.isBattery.capacity;
        }
        systemEntities.push(entity);

        break;
      }
      default: {
        const entity = spawnShipSystem(systemPlugin, system.overrides);
        systemEntities.push(entity);
        if (entity.components.power) {
          // Hook up the power node
          const leastPowerNode = Object.entries(powerNodes).reduce(
            (prev, next) => {
              if (next[1].count < prev.count) return next[1];
              return prev;
            },
            powerNodes[Object.keys(powerNodes)[0]]
          );
          const powerNode =
            powerNodes[systemPlugin.powerNode || ""] || leastPowerNode;
          powerNode.count += 1;
          powerNode.entity.components.isPowerNode?.connectedSystems.push(
            entity.id
          );
        }
        break;
      }
    }
  });

  // Now let's power up the reactors
  const totalPower = systemEntities.reduce((prev, next) => {
    return prev + (next.components.power?.defaultPower || 0);
  }, 0);
  const reactorCount =
    template.shipSystems?.reduce((prev, system) => {
      const systemPlugin = getSystem(
        dataContext,
        system.systemId,
        system.pluginId
      );
      if (systemPlugin instanceof ReactorPlugin) {
        return (
          prev + (system.overrides?.reactorCount || systemPlugin.reactorCount)
        );
      }
      return prev;
    }, 0) || 1;

  // Split amongst the reactors and generously make it a nice round number
  const reactorPower = Math.ceil(totalPower / reactorCount / 5) * 5;

  template.shipSystems?.forEach(system => {
    const systemPlugin = getSystem(
      dataContext,
      system.systemId,
      system.pluginId
    );
    if (systemPlugin instanceof ReactorPlugin) {
      Array.from({length: systemPlugin.reactorCount}).forEach(() => {
        const sys = spawnShipSystem(systemPlugin, system.overrides);
        const maxOutput = reactorPower * systemPlugin.powerMultiplier;
        sys.updateComponent("isReactor", {
          maxOutput,
          currentOutput: maxOutput * systemPlugin.optimalOutputPercent,
          desiredOutput: maxOutput * systemPlugin.optimalOutputPercent,
          optimalOutputPercent: systemPlugin.optimalOutputPercent,
        });
        systemEntities.push(sys);
      });
    }
  });
  systemEntities.forEach(e => {
    entity.components.shipSystems?.shipSystems.set(e.id, {});
  });
  if (params.playerShip) {
    entity.addComponent("isPlayerShip");
  }
  let extraEntities: Entity[] = [];
  // Initialize the ship map. For now, we'll just load the ship map onto a component of the ship.
  // In the future, rooms themselves might become entities.
  if (
    entity.components.isPlayerShip &&
    template.decks &&
    template.decks?.length > 0
  ) {
    const deckNodes =
      template.decks?.flatMap((deck, i) =>
        deck.nodes.map(n => ({...n, deckIndex: i, contents: {}}))
      ) || [];
    generateShipInventory(
      deckNodes.map(node => ({
        id: node.id,
        contents: node.contents,
        flags: node.flags,
        volume: node.volume,
        systems: node.systems,
      })),
      inventoryTemplates,
      {
        powerNeed: totalPower * 2.5, // Convert megawatts into 2.5 MegaWatt hours
      }
    );

    entity.addComponent("shipMap", {
      decks: template.decks || [],
      deckNodes,
      deckEdges: template.deckEdges || [],
    });

    // Place cargo containers
    Array.from({length: template.cargoContainers || 0}).forEach((_, i) => {
      // TODO June 24, 2022: Maybe make this use the ECS PRNG
      const randomRoom = randomFromList(deckNodes.filter(n => n.isRoom));
      if (!randomRoom) return;
      const cargoContainer = new Entity();
      cargoContainer.addComponent("identity", {
        name: `Container ${greekLetters[i]}${i > 25 ? i : ""}`,
      });
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
      cargoContainer.addComponent("passengerMovement", {
        destinationNode: randomRoom.id,
      });
      extraEntities.push(cargoContainer);
    });
  } else {
    // Give the ship some cargo space without creating any rooms
    entity.addComponent("cargoContainer", {
      // TODO June 24, 2022: Make this a configurable value
      volume: 500,
    });
    generateShipInventory(
      [
        {
          id: entity.id,
          contents: entity.components.cargoContainer?.contents || {},
          flags: ["cargo"],
          volume: entity.components.cargoContainer?.volume || 500,
          systems: [],
        },
      ],
      inventoryTemplates,
      {
        powerNeed: totalPower * 2.5, // Convert megawatts into 2.5 MegaWatt hours
      }
    );
  }

  // With the deck map initialized, we can now assign rooms to systems
  let occupiedRooms: number[] = [];
  for (let [id, info] of entity.components.shipSystems?.shipSystems || []) {
    const system = systemEntities.find(sys => sys.id === id);
    const systemType = system?.components.isShipSystem?.type;
    if (!systemType) continue;
    const availableRooms =
      entity.components.shipMap?.deckNodes.filter(node =>
        node.systems.includes(systemType)
      ) || [];

    if (occupiedRooms.length === availableRooms.length) {
      occupiedRooms = [];
    }
    availableRooms.filter(a => !occupiedRooms.includes(a.id));

    const roomAssignment = randomFromList(availableRooms);
    if (!roomAssignment) continue;
    occupiedRooms.push(roomAssignment.id);
    entity.components.shipSystems?.shipSystems.set(id, {
      ...info,
      roomId: roomAssignment.id,
    });
  }

  return {ship: entity, extraEntities: systemEntities.concat(extraEntities)};
}
