import {InventoryTemplate} from "../classes/Plugins/Inventory";
import {InventoryFlagValues} from "../classes/Plugins/Inventory/InventoryFlags";
import {Entity} from "../utils/ecs";
import {generateShipInventory} from "./inventory";
let oldRandom: any;
describe("Inventory Generator", () => {
  beforeEach(() => {
    oldRandom = Math.random;
    Math.random = () => 0.5;
  });
  afterEach(() => {
    Math.random = oldRandom;
  });
  it("Should spawn inventory given a set of templates and a set of rooms", async () => {
    const inputRooms: Entity[] = [];
    const torpedoRoom = new Entity();
    torpedoRoom.addComponent("isRoom", {
      flags: ["torpedoStorage"],
    });
    torpedoRoom.addComponent("cargoContainer", {
      volume: 100,
    });
    inputRooms.push(torpedoRoom);
    const torpedoRoom2 = new Entity();
    torpedoRoom2.addComponent("isRoom", {
      flags: ["torpedoStorage"],
    });
    torpedoRoom2.addComponent("cargoContainer", {
      volume: 100,
    });
    inputRooms.push(torpedoRoom2);
    const probesRoom = new Entity();
    probesRoom.addComponent("isRoom", {
      flags: ["probeStorage"],
    });
    probesRoom.addComponent("cargoContainer", {
      volume: 100,
    });
    inputRooms.push(probesRoom);
    const securityRoom = new Entity();
    securityRoom.addComponent("isRoom", {
      flags: ["security"],
    });
    securityRoom.addComponent("cargoContainer", {
      volume: 100,
    });
    inputRooms.push(securityRoom);
    const maintenanceRoom = new Entity();
    maintenanceRoom.addComponent("isRoom", {
      flags: ["maintenance"],
    });
    maintenanceRoom.addComponent("cargoContainer", {
      volume: 100,
    });
    inputRooms.push(maintenanceRoom);
    const medicalRoom = new Entity();
    medicalRoom.addComponent("isRoom", {
      flags: ["medical"],
    });
    medicalRoom.addComponent("cargoContainer", {
      volume: 100,
    });
    inputRooms.push(medicalRoom);
    const cargoRoom = new Entity();
    cargoRoom.addComponent("isRoom", {
      flags: ["cargo"],
    });
    cargoRoom.addComponent("cargoContainer", {
      volume: 1000,
    });
    inputRooms.push(cargoRoom);

    const flightInventory: {
      [inventoryTemplateName: string]: InventoryTemplate;
    } = {};
    Object.keys(InventoryFlagValues).forEach((key, i) => {
      flightInventory[key] = new InventoryTemplate({
        name: `Test ${key} Cargo`,
        volume: 20 - i,
        abundance: i + 1,
        flags: {[key]: {}},
      });
    });

    flightInventory["random"] = new InventoryTemplate({
      name: `Test Random Cargo`,
      volume: 1,
      abundance: 1,
    });
    generateShipInventory(
      inputRooms.map(room => {
        return {
          id: room.id,
          contents: room.components.cargoContainer?.contents || {},
          flags: room.components.isRoom?.flags || [],
          volume: room.components.cargoContainer?.volume || 1,
        };
      }),
      flightInventory
    );
    expect(inputRooms).toMatchInlineSnapshot(`
      Array [
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test torpedoCasing Cargo": Object {
                  "count": 3,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "torpedoStorage",
              ],
            },
          },
          "id": 1,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test torpedoCasing Cargo": Object {
                  "count": 8,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "torpedoStorage",
              ],
            },
          },
          "id": 2,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test probeCasing Cargo": Object {
                  "count": 1,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": Object {
                  "count": 2,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "probeStorage",
              ],
            },
          },
          "id": 3,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test security Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "security",
              ],
            },
          },
          "id": 4,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test repair Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "maintenance",
              ],
            },
          },
          "id": 5,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test medical Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "medical",
              ],
            },
          },
          "id": 6,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test coolant Cargo": Object {
                  "count": 3,
                  "temperature": 295.37,
                },
                "Test forCrew Cargo": Object {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test fuel Cargo": Object {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test medical Cargo": Object {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test probeCasing Cargo": Object {
                  "count": 13,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": Object {
                  "count": 13,
                  "temperature": 295.37,
                },
                "Test repair Cargo": Object {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test science Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
                "Test security Cargo": Object {
                  "count": 3,
                  "temperature": 295.37,
                },
                "Test sparePart Cargo": Object {
                  "count": 10,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": Object {
                  "count": 8,
                  "temperature": 295.37,
                },
              },
              "volume": 1000,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "cargo",
              ],
            },
          },
          "id": 7,
        },
      ]
    `);
  });
  it("should spawn inventory given a ship with a single room for cargo", () => {
    const inputRooms: Entity[] = [];
    const cargoRoom = new Entity();
    cargoRoom.addComponent("cargoContainer", {
      volume: 1000,
    });
    inputRooms.push(cargoRoom);
    const flightInventory: {
      [inventoryTemplateName: string]: InventoryTemplate;
    } = {};
    Object.keys(InventoryFlagValues).forEach((key, i) => {
      flightInventory[key] = new InventoryTemplate({
        name: `Test ${key} Cargo`,
        volume: 20 - i,
        abundance: i + 1,
        flags: {[key]: {}},
      });
    });

    flightInventory["random"] = new InventoryTemplate({
      name: `Test Random Cargo`,
      volume: 1,
      abundance: 1,
    });
    generateShipInventory(
      inputRooms.map(room => {
        return {
          id: room.id,
          contents: room.components.cargoContainer?.contents || {},
          flags: ["cargo"],
          volume: room.components.cargoContainer?.volume || 1,
        };
      }),
      flightInventory
    );
    expect(inputRooms).toMatchInlineSnapshot(`
      Array [
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test coolant Cargo": Object {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test fuel Cargo": Object {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test probeCasing Cargo": Object {
                  "count": 17,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": Object {
                  "count": 19,
                  "temperature": 295.37,
                },
                "Test torpedoCasing Cargo": Object {
                  "count": 14,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": Object {
                  "count": 16,
                  "temperature": 295.37,
                },
              },
              "volume": 1000,
            },
          },
          "id": 8,
        },
      ]
    `);
  });
});
