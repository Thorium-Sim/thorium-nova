import {DeckEdge, DeckNode} from "server/src/classes/Plugins/Ship/Deck";
import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {ECS, Entity} from "server/src/utils/ecs";
import {
  calculateShipMapPath,
  createShipMapGraph,
} from "server/src/utils/shipMapPathfinder";
import {PassengerMovementSystem} from "../PassengerMovementSystem";

describe("PassengerMovementSystem", () => {
  let ecs: ECS;
  let ship: Entity;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();

    ecs = new ECS(mockDataContext.server);
    ecs.addSystem(new PassengerMovementSystem());
    ship = new Entity();
    ship.addComponent("shipMap", {
      decks: [
        {
          name: "Deck 1",
          backgroundUrl: "",
        },
        {
          name: "Deck 2",
          backgroundUrl: "",
        },
      ],
      deckNodes: [
        new DeckNode({
          id: 1,
          deckIndex: 0,
          x: 0,
          y: 0,
        }),
        new DeckNode({
          id: 2,
          deckIndex: 0,
          x: 1,
          y: 1,
        }),
        new DeckNode({
          id: 3,
          deckIndex: 0,
          x: 2,
          y: 1,
        }),
        new DeckNode({
          id: 4,
          deckIndex: 1,
          x: 2,
          y: 1,
        }),
        new DeckNode({
          id: 5,
          deckIndex: 1,
          x: 1,
          y: 0,
        }),
      ],
      deckEdges: [
        new DeckEdge({
          id: 1,
          from: 1,
          to: 2,
        }),
        new DeckEdge({
          id: 2,
          from: 2,
          to: 3,
        }),
        new DeckEdge({
          id: 2,
          from: 3,
          to: 4,
        }),
        new DeckEdge({
          id: 2,
          from: 4,
          to: 5,
        }),
      ],
    });
    ship?.updateComponent("shipMap", {
      graph: createShipMapGraph(ship.components.shipMap?.deckEdges || []),
    });
    ecs.addEntity(ship);
  });
  it("should move a passenger within the same deck", () => {
    let updateTime = 0;
    function update(updateCount = 1) {
      for (let i = 20 * updateCount; i > 0; i--) {
        ecs.update(16);
        updateTime += 16;
      }
    }
    let passenger = new Entity();
    passenger.addComponent("position", {
      x: 0,
      y: 0,
      z: 0,
      parentId: ship.id,
      type: "ship",
    });
    passenger.addComponent("passengerMovement");
    ecs.addEntity(passenger);
    ecs.update(16);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 0,
        "type": "ship",
        "x": 0,
        "y": 0,
        "z": 0,
      }
    `);
    if (!ship.components.shipMap?.graph)
      throw new Error("shipMap.graph is undefined");
    const nodePath = calculateShipMapPath(ship.components.shipMap?.graph, 1, 3);
    if (!nodePath) throw new Error("unable to calculate node path");
    passenger.updateComponent("passengerMovement", {
      nodePath,
      nextNodeIndex: 0,
    });
    update(2);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 0,
        "type": "ship",
        "x": 0.2941564209736038,
        "y": 0.2941564209736038,
        "z": 0,
      }
    `);
    expect(passenger.components.passengerMovement?.nextNodeIndex).toBe(1);
    update(7);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 0,
        "type": "ship",
        "x": 0.9525462151064351,
        "y": 0.9525462151064351,
        "z": 0,
      }
    `);
    expect(passenger.components.passengerMovement?.nextNodeIndex).toBe(2);
    update(8);
    const oldX = passenger.components.position?.x;
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 0,
        "type": "ship",
        "x": 2,
        "y": 1,
        "z": 0,
      }
    `);
    expect(passenger.components.passengerMovement?.nextNodeIndex).toBe(0);
    expect(updateTime).toMatchInlineSnapshot(`5440`);
    update();
    expect(passenger.components.position?.x).toBe(oldX);
  });
  it("should move a passenger between decks", () => {
    let updateTime = 0;
    function update(updateCount = 1) {
      for (let i = 20 * updateCount; i > 0; i--) {
        ecs.update(16);
        updateTime += 16;
      }
    }

    let passenger = new Entity();
    passenger.addComponent("position", {
      x: 2,
      y: 1,
      z: 0,
      parentId: ship.id,
      type: "ship",
    });
    passenger.addComponent("passengerMovement");
    ecs.addEntity(passenger);
    ecs.update(16);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 2,
        "type": "ship",
        "x": 2,
        "y": 1,
        "z": 0,
      }
    `);
    if (!ship.components.shipMap?.graph)
      throw new Error("shipMap.graph is undefined");
    const nodePath = calculateShipMapPath(ship.components.shipMap?.graph, 3, 5);
    if (!nodePath) throw new Error("unable to calculate node path");
    passenger.updateComponent("passengerMovement", {
      nodePath,
      nextNodeIndex: 0,
    });
    update(2);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 2,
        "type": "ship",
        "x": 2,
        "y": 1,
        "z": 0.041600000000000005,
      }
    `);
    expect(passenger.components.passengerMovement?.nextNodeIndex).toBe(1);
    update(22);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 2,
        "type": "ship",
        "x": 2,
        "y": 1,
        "z": 1,
      }
    `);
    update(4);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 2,
        "type": "ship",
        "x": 1.2219398082404278,
        "y": 0.22193980824042775,
        "z": 1,
      }
    `);
    update(4);
    expect(passenger.components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 2,
        "type": "ship",
        "x": 1,
        "y": 0,
        "z": 1,
      }
    `);
    expect(updateTime).toMatchInlineSnapshot(`10240`);
  });
});
