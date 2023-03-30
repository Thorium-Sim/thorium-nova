import {
  InventoryFlags,
  InventoryFlagValues,
} from "../classes/Plugins/Inventory/InventoryFlags";
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
      [inventoryTemplateName: string]: {
        name: string;
        volume: number;
        abundance: number;
        flags: InventoryFlags;
      };
    } = {};
    Object.keys(InventoryFlagValues).forEach((key, i) => {
      if (key === "fuel") {
        flightInventory[key] = {
          name: `Test ${key} Cargo`,
          volume: 20 - i,
          abundance: i + 1,
          flags: {
            fuel: {fuelDensity: 41},
          },
        };
        return;
      }
      flightInventory[key] = {
        name: `Test ${key} Cargo`,
        volume: 20 - i,
        abundance: i + 1,
        flags: {
          [key]: {},
        },
      };
    });

    flightInventory["random"] = {
      name: `Test Random Cargo`,
      volume: 1,
      abundance: 1,
      flags: {},
    };
    generateShipInventory(
      inputRooms.map(room => {
        return {
          id: room.id,
          contents: room.components.cargoContainer?.contents || {},
          flags: room.components.isRoom?.flags || [],
          volume: room.components.cargoContainer?.volume || 1,
          systems: [],
        };
      }),
      flightInventory,
      {powerNeed: 0}
    );
    expect(inputRooms).toMatchInlineSnapshot(`
      Array [
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test torpedoCasing Cargo": Object {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": Object {
                  "count": 4,
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
                  "count": 9,
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
      [inventoryTemplateName: string]: {
        name: string;
        volume: number;
        abundance: number;
        flags: InventoryFlags;
      };
    } = {};
    Object.keys(InventoryFlagValues).forEach((key, i) => {
      if (key === "fuel") {
        flightInventory[key] = {
          name: `Test ${key} Cargo`,
          volume: 20 - i,
          abundance: i + 1,
          flags: {
            fuel: {fuelDensity: 41},
          },
        };
        return;
      }
      flightInventory[key] = {
        name: `Test ${key} Cargo`,
        volume: 20 - i,
        abundance: i + 1,
        flags: {
          [key]: {},
        },
      };
    });

    flightInventory["random"] = {
      name: `Test Random Cargo`,
      volume: 1,
      abundance: 1,
      flags: {},
    };
    generateShipInventory(
      inputRooms.map(room => {
        return {
          id: room.id,
          contents: room.components.cargoContainer?.contents || {},
          flags: ["cargo"],
          volume: room.components.cargoContainer?.volume || 1,
          systems: [],
        };
      }),
      flightInventory,
      {
        powerNeed: 0,
      }
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
                "Test probeCasing Cargo": Object {
                  "count": 18,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": Object {
                  "count": 19,
                  "temperature": 295.37,
                },
                "Test torpedoCasing Cargo": Object {
                  "count": 15,
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
  it("Should spawn inventory when the ship has power needs", async () => {
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
    const reactorRoom = new Entity();
    reactorRoom.id = 444;
    reactorRoom.addComponent("isRoom", {
      flags: [],
    });
    reactorRoom.addComponent("cargoContainer", {
      volume: 100,
    });
    reactorRoom.addComponent("identity", {name: "Reactor Room"});
    inputRooms.push(reactorRoom);
    const fuelRoom = new Entity();
    fuelRoom.addComponent("isRoom", {
      flags: ["fuelStorage"],
    });
    fuelRoom.addComponent("cargoContainer", {
      volume: 100,
    });
    inputRooms.push(fuelRoom);
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
      [inventoryTemplateName: string]: {
        name: string;
        volume: number;
        abundance: number;
        flags: InventoryFlags;
      };
    } = {};
    Object.keys(InventoryFlagValues).forEach((key, i) => {
      if (key === "fuel") {
        flightInventory[key] = {
          name: `Test ${key} Cargo`,
          volume: 20 - i,
          abundance: i + 1,
          flags: {
            fuel: {fuelDensity: 41},
          },
        };
        return;
      }
      flightInventory[key] = {
        name: `Test ${key} Cargo`,
        volume: 20 - i,
        abundance: i + 1,
        flags: {
          [key]: {},
        },
      };
    });

    flightInventory["random"] = {
      name: `Test Random Cargo`,
      volume: 1,
      abundance: 1,
      flags: {},
    };
    generateShipInventory(
      inputRooms.map(room => {
        return {
          id: room.id,
          contents: room.components.cargoContainer?.contents || {},
          flags: room.components.isRoom?.flags || [],
          volume: room.components.cargoContainer?.volume || 1,
          systems: room.id === 444 ? ["reactor"] : [],
        };
      }),
      flightInventory,
      {powerNeed: 1000}
    );
    expect(inputRooms).toMatchInlineSnapshot(`
      Array [
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test torpedoCasing Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": Object {
                  "count": 3,
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
          "id": 9,
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
          "id": 10,
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
          "id": 11,
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
          "id": 12,
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
          "id": 13,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test fuel Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "identity": IdentityComponent {
              "description": "",
              "name": "Reactor Room",
            },
            "isRoom": IsRoomComponent {
              "flags": Array [],
            },
          },
          "id": 444,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {},
              "volume": 100,
            },
            "isRoom": IsRoomComponent {
              "flags": Array [
                "fuelStorage",
              ],
            },
          },
          "id": 15,
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
          "id": 16,
        },
        Object {
          "components": Object {
            "cargoContainer": CargoContainer {
              "contents": Object {
                "Test fuel Cargo": Object {
                  "count": 20,
                  "temperature": 295.37,
                },
                "Test medical Cargo": Object {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test probeCasing Cargo": Object {
                  "count": 15,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": Object {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test repair Cargo": Object {
                  "count": 5,
                  "temperature": 295.37,
                },
                "Test security Cargo": Object {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test sparePart Cargo": Object {
                  "count": 11,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": Object {
                  "count": 11,
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
          "id": 17,
        },
      ]
    `);
  });
});
