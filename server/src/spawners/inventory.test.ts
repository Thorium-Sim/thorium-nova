import {
	type InventoryFlags,
	InventoryFlagValues,
} from "../classes/Plugins/Inventory/InventoryFlags";
import { Entity } from "../utils/ecs";
import { generateShipInventory } from "./inventory";
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
						fuel: { fuelDensity: 41 },
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

		flightInventory.random = {
			name: `Test Random Cargo`,
			volume: 1,
			abundance: 1,
			flags: {},
		};
		generateShipInventory(
			inputRooms.map((room) => {
				return {
					id: room.id,
					contents: room.components.cargoContainer?.contents || {},
					flags: room.components.isRoom?.flags || [],
					volume: room.components.cargoContainer?.volume || 1,
					systems: [],
				};
			}),
			flightInventory,
			{ powerNeed: 0 },
		);
		expect(inputRooms).toMatchInlineSnapshot(`
      [
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test torpedoCasing Cargo": {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": {
                  "count": 4,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "torpedoStorage",
              ],
            },
          },
          "id": 1,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test torpedoCasing Cargo": {
                  "count": 8,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "torpedoStorage",
              ],
            },
          },
          "id": 2,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test probeCasing Cargo": {
                  "count": 1,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": {
                  "count": 2,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "probeStorage",
              ],
            },
          },
          "id": 3,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test security Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "security",
              ],
            },
          },
          "id": 4,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test repair Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "maintenance",
              ],
            },
          },
          "id": 5,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test medical Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "medical",
              ],
            },
          },
          "id": 6,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test coolant Cargo": {
                  "count": 3,
                  "temperature": 295.37,
                },
                "Test forCrew Cargo": {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test medical Cargo": {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test probeCasing Cargo": {
                  "count": 13,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": {
                  "count": 13,
                  "temperature": 295.37,
                },
                "Test repair Cargo": {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test science Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
                "Test security Cargo": {
                  "count": 3,
                  "temperature": 295.37,
                },
                "Test sparePart Cargo": {
                  "count": 10,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": {
                  "count": 9,
                  "temperature": 295.37,
                },
              },
              "volume": 1000,
            },
            "isRoom": {
              "flags": [
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
						fuel: { fuelDensity: 41 },
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

		flightInventory.random = {
			name: `Test Random Cargo`,
			volume: 1,
			abundance: 1,
			flags: {},
		};
		generateShipInventory(
			inputRooms.map((room) => {
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
			},
		);
		expect(inputRooms).toMatchInlineSnapshot(`
      [
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test coolant Cargo": {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test probeCasing Cargo": {
                  "count": 18,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": {
                  "count": 19,
                  "temperature": 295.37,
                },
                "Test torpedoCasing Cargo": {
                  "count": 15,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": {
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
		reactorRoom.addComponent("identity", { name: "Reactor Room" });
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
						fuel: { fuelDensity: 41 },
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

		flightInventory.random = {
			name: `Test Random Cargo`,
			volume: 1,
			abundance: 1,
			flags: {},
		};
		generateShipInventory(
			inputRooms.map((room) => {
				return {
					id: room.id,
					contents: room.components.cargoContainer?.contents || {},
					flags: room.components.isRoom?.flags || [],
					volume: room.components.cargoContainer?.volume || 1,
					systems: room.id === 444 ? ["reactor"] : [],
				};
			}),
			flightInventory,
			{ powerNeed: 1000 },
		);
		expect(inputRooms).toMatchInlineSnapshot(`
      [
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test torpedoCasing Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": {
                  "count": 3,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "torpedoStorage",
              ],
            },
          },
          "id": 9,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test torpedoCasing Cargo": {
                  "count": 8,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "torpedoStorage",
              ],
            },
          },
          "id": 10,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test probeCasing Cargo": {
                  "count": 1,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": {
                  "count": 2,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "probeStorage",
              ],
            },
          },
          "id": 11,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test security Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "security",
              ],
            },
          },
          "id": 12,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test repair Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "maintenance",
              ],
            },
          },
          "id": 13,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test fuel Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "identity": {
              "name": "Reactor Room",
            },
            "isRoom": {
              "flags": [],
            },
          },
          "id": 444,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {},
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "fuelStorage",
              ],
            },
          },
          "id": 15,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test medical Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
              },
              "volume": 100,
            },
            "isRoom": {
              "flags": [
                "medical",
              ],
            },
          },
          "id": 16,
        },
        {
          "components": {
            "cargoContainer": {
              "contents": {
                "Test fuel Cargo": {
                  "count": 20,
                  "temperature": 295.37,
                },
                "Test medical Cargo": {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test probeCasing Cargo": {
                  "count": 15,
                  "temperature": 295.37,
                },
                "Test probeEquipment Cargo": {
                  "count": 2,
                  "temperature": 295.37,
                },
                "Test repair Cargo": {
                  "count": 5,
                  "temperature": 295.37,
                },
                "Test security Cargo": {
                  "count": 4,
                  "temperature": 295.37,
                },
                "Test sparePart Cargo": {
                  "count": 11,
                  "temperature": 295.37,
                },
                "Test torpedoWarhead Cargo": {
                  "count": 11,
                  "temperature": 295.37,
                },
              },
              "volume": 1000,
            },
            "isRoom": {
              "flags": [
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
