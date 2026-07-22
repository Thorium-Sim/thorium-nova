import { DeckEdge, DeckNode } from "@thorium/.server/classes/Plugins/Ship/Deck";
import { ExocompPowerSystem, ExocompSystem } from "@thorium/.server/systems/ExocompSystem";
import { FilterInventorySystem } from "@thorium/.server/systems/FilterInventorySystem";
import { PassengerMovementSystem } from "@thorium/.server/systems/PassengerMovementSystem";
import { thoriumContext } from "@thorium/utils/.server/context";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { processTriggers } from "@thorium/utils/.server/processTriggers";
import { Entity } from "@thorium/utils/ecs";
import ECS from "@thorium/utils/ecs/ecs";
import { aroundEach, beforeEach, describe, expect, it } from "vitest";

aroundEach(async (runTest) => {
	await thoriumContext.run(testDataStoreProps, async () => {
		await runTest();
	});
});

describe("Exocomp System", () => {
	let ecs: ECS;
	let exocompSystem: ExocompSystem;
	let exocompPowerSystem: ExocompPowerSystem;
	let passengerMovementSystem: PassengerMovementSystem;
	let inventoryTemplate: Entity;
	let ship: Entity;
	let exocompShipSystem: Entity;
	let exocomps: Entity[];
	let brokenSystem: Entity;
	beforeEach(() => {
		const mockDataContext = createMockDataContext();
		ecs = new ECS(mockDataContext.server);
		ecs.executeBlocks = (blocks, blockMetadata) => executeBlocks(ecs, blocks, blockMetadata);
		ecs.processTriggers = (events) => processTriggers(ecs, events);
		exocompSystem = new ExocompSystem();
		ecs.addSystem(exocompSystem);
		exocompPowerSystem = new ExocompPowerSystem();
		ecs.addSystem(exocompPowerSystem);
		passengerMovementSystem = new PassengerMovementSystem();
		ecs.addSystem(passengerMovementSystem);
		ecs.addSystem(new FilterInventorySystem());

		inventoryTemplate = new Entity();
		inventoryTemplate.addComponent("identity", { name: "Repair Item" });
		inventoryTemplate.addComponent("isInventory", {
			continuous: false,
			durability: 1,
			plural: "Repair Items",
			volume: 0.5,
			abundance: 1,
			flags: {
				repair: {
					type: ["Exocomp"],
				},
			},
		});
		ecs.addEntity(inventoryTemplate);

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
					isRoom: true,
					flags: ["cargo"],
					systems: ["exocomps"],
				}),
				new DeckNode({
					id: 2,
					deckIndex: 0,
					x: 1,
					y: 1,
					isRoom: true,
					name: "Main Cargo Room",
					flags: ["cargo"],
					contents: {
						"Repair Item": {
							count: 10,
						},
					},
				}),
				new DeckNode({
					id: 3,
					deckIndex: 0,
					x: 2,
					y: 1,
					isRoom: true,
					flags: ["cargo"],
				}),
				new DeckNode({
					id: 4,
					deckIndex: 1,
					x: 2,
					y: 1,
					isRoom: true,
					flags: ["cargo"],
					systems: ["shields"],
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
		ship.addComponent("shipSystems");
		ecs.addEntity(ship);

		exocompShipSystem = new Entity();
		exocompShipSystem.addComponent("identity", { name: "Exocomp System" });
		exocompShipSystem.addComponent("isShipSystem", { type: "exocomps", shipId: ship.id });
		exocompShipSystem.addComponent("power", {
			currentPower: 2,
			powerDraw: 2,
			powerLevels: [1, 5],
		});
		exocompShipSystem.addComponent("isExocomps");
		ecs.addEntity(exocompShipSystem);

		exocomps = [];
		for (let i = 0; i < 3; i++) {
			const exocompEntity = new Entity();
			exocompEntity.addComponent("identity", { name: `Exocomp ${i + 1}` });
			exocompEntity.addComponent("exocomp", {
				shipId: ship.id,
				maxCharge: 1,
				chargeRate: 0.5,
				idleDischargeRate: 0.1,
				workingDischargeRate: 0.4,
				movingDischargeRate: 0.2,
			});
			const movementSpeed = 3;
			exocompEntity.addComponent("cargoContainer", { volume: 10 });
			exocompEntity.addComponent("passengerMovement", {
				movementMaxVelocity: { x: movementSpeed, y: movementSpeed, z: movementSpeed / 10 },
				destinationNode: 1,
			});
			// Place this exocomp inside the exocomp room. Otherwise, put it in a random place on the ship and log a warning.
			exocompEntity.addComponent("position", {
				parentId: ship.id,
				type: "ship",
				x: 0,
				y: 0,
				z: 0,
			});
			ecs.addEntity(exocompEntity);
			exocomps.push(exocompEntity);
		}

		brokenSystem = new Entity();
		brokenSystem.addComponent("identity", { name: "Shields" });
		brokenSystem.addComponent("isShipSystem", { type: "shields", shipId: ship.id });
		brokenSystem.addComponent("isShields");
		ecs.addEntity(brokenSystem);
		ship.updateComponent("shipSystems", {
			shipSystems: ship.components.shipSystems?.shipSystems.set(brokenSystem.id, { roomId: 4 }),
		});
	});

	it("should charge exocomps in the exocomp room", () => {
		const exocompRoomId = ship.components.shipMap?.deckNodes.find((d) =>
			d.systems.includes("exocomps"),
		)?.id;
		expect(exocompRoomId).toBeTruthy();
		expect(exocomps[0].components.passengerMovement?.destinationNode).toEqual(exocompRoomId);
		expect(exocomps[0].components.passengerMovement?.nodePath).toEqual([]);

		exocomps[0].updateComponent("exocomp", { currentCharge: 0.1 });
		expect(exocomps[0].components.exocomp?.currentCharge).toEqual(0.1);

		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.exocomp?.currentCharge).toBeGreaterThan(0.1);
	});
	it("should split available power between charging exocomps until one of the exocomps becomes fully charged", () => {
		exocomps[0].updateComponent("exocomp", { currentCharge: 0.1 });
		expect(exocomps[0].components.exocomp?.currentCharge).toEqual(0.1);
		ecs.update(16);
		const diff = 0.1 - exocomps[0].components.exocomp!.currentCharge;

		exocomps[0].updateComponent("exocomp", { currentCharge: 0.1 });
		exocomps[1].updateComponent("exocomp", { currentCharge: 0.1 });
		expect(exocomps[0].components.exocomp?.currentCharge).toEqual(0.1);
		expect(exocomps[1].components.exocomp?.currentCharge).toEqual(0.1);

		ecs.update(16);
		const diff2 = 0.1 - exocomps[0].components.exocomp!.currentCharge;

		expect(diff / 2).toEqual(diff2);
	});
	it("should idle discharge exocomps outside the exocomp room", () => {
		exocomps[0].updateComponent("passengerMovement", { destinationNode: 2 });
		expect(exocomps[0].components.exocomp?.currentCharge).toEqual(1);

		ecs.update(16);
		expect(exocomps[0].components.exocomp?.currentCharge).toBeLessThan(1);
	});
	it("should discharge exocomps that are moving", () => {
		exocomps[0].updateComponent("passengerMovement", { destinationNode: 2 });
		expect(exocomps[0].components.exocomp?.currentCharge).toEqual(1);

		ecs.update(16);
		expect(exocomps[0].components.exocomp?.currentCharge).toBeLessThan(1);
		const diff = 1 - exocomps[0].components.exocomp!.currentCharge;
		exocomps[0].updateComponent("exocomp", { currentCharge: 1 });

		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [{ type: "goTo", roomId: 3 }],
		});
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		const diff1 = 1 - exocomps[0].components.exocomp!.currentCharge;
		expect(diff1).toBeGreaterThan(diff);
	});
	it.todo("should discharge exocomps that are working", () => {});
	it("should send the exocomp back to its home when it runs out of power", () => {
		exocomps[0].updateComponent("passengerMovement", {
			destinationNode: 2,
		});
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [
				{ type: "goTo", roomId: 3 },
				{ type: "cool", duration: 10 },
			],
			currentCharge: 0.00001,
		});

		for (let i = 0; i < 350; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.passengerMovement?.movementVelocityMultiplier).toBeLessThan(1);
		expect(exocomps[0].components.exocomp?.instructions[0]?.type).toEqual("goTo");
		for (let i = 0; i < 350; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.passengerMovement?.destinationNode).toEqual(1);
		expect(exocomps[0].components.passengerMovement?.movementVelocityMultiplier).toEqual(1);
		expect(exocomps[0].components.exocomp?.instructions).toEqual([]);
	});
	it("should automatically send exocomps to where the cargo is when retrieving cargo", () => {
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [{ type: "retrieveCargo", cargo: [{ name: "Repair Item", count: 2 }] }],
		});
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.cargoContainer?.contents["Repair Item"]?.count).toEqual(
			undefined,
		);
		expect(exocomps[0].components.passengerMovement?.destinationNode).toEqual(2);
		for (let i = 0; i < 120; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.exocomp?.logs[1].text).toEqual(
			"Collected cargo from Main Cargo Room: 2 Repair Items",
		);
		expect(exocomps[0].components.cargoContainer?.contents["Repair Item"]?.count).toEqual(2);
	});
	it("should send the exocomp between two rooms with two go to commands", () => {
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [
				{ type: "goTo", roomId: 5 },
				{ type: "goTo", roomId: 3 },
			],
		});
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.passengerMovement?.destinationNode).toEqual(5);
		for (let i = 0; i < 800; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.passengerMovement?.destinationNode).toEqual(3);
		expect(exocomps[0].components.passengerMovement?.nodePath.length).toBeGreaterThan(0);
		for (let i = 0; i < 300; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.passengerMovement?.nodePath).toEqual([]);
		expect(exocomps[0].components.exocomp?.logs.at(-1)?.text).toEqual(
			"Instructions complete. Ready for new orders.",
		);
	});
	it("should properly transfer cargo between rooms when depositing cargo", () => {
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [
				{ type: "retrieveCargo", cargo: [{ count: 1, name: "Repair Item" }] },
				{ type: "goTo", roomId: 3 },
				{ type: "depositCargo" },
			],
		});
		expect(ship.components.shipMap?.deckNodes.find((d) => d.id === 3)?.contents).toEqual({});
		for (let i = 0; i < 200; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.cargoContainer?.contents).toMatchObject({
			"Repair Item": { count: 1 },
		});
		for (let i = 0; i < 200; i++) {
			ecs.update(16);
		}
		expect(ship.components.shipMap?.deckNodes.find((d) => d.id === 3)?.contents).toMatchObject({
			"Repair Item": { count: 1 },
		});
	});
	it("should properly use cargo to repair a system", () => {
		const damageAssignment = new Entity();
		damageAssignment.addComponent("damageControlAssignment", {
			shipId: ship.id,
			systemId: brokenSystem.id,
			requiredInventory: [{ name: "Repair Item", count: 1, present: 0 }],
		});
		ecs.addEntity(damageAssignment);
		expect(damageAssignment.components.damageControlAssignment?.progress).toEqual(0);
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [
				{ type: "retrieveCargo", cargo: [{ count: 1, name: "Repair Item" }] },
				{ type: "goTo", roomId: 4 },
				{ type: "useCargo" },
			],
		});

		for (let i = 0; i < 200; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.cargoContainer?.contents).toMatchObject({
			"Repair Item": { count: 1 },
		});
		expect(damageAssignment.components.damageControlAssignment?.progress).toEqual(0);
		for (let i = 0; i < 400; i++) {
			ecs.update(16);
		}
		expect(damageAssignment.components.damageControlAssignment?.progress).toEqual(1);
	});
	it("should increase the progress of a damage assignment when given the correct instructions", () => {
		const damageAssignment = new Entity();
		damageAssignment.addComponent("damageControlAssignment", {
			shipId: ship.id,
			systemId: brokenSystem.id,
			requiredAction: { type: "cool", duration: 2 },
		});
		ecs.addEntity(damageAssignment);
		expect(damageAssignment.components.damageControlAssignment?.progress).toEqual(0);
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [
				{ type: "goTo", roomId: 4 },
				{ type: "cool", duration: 1 },
			],
		});

		expect(damageAssignment.components.damageControlAssignment?.progress).toEqual(0);
		for (let i = 0; i < 550; i++) {
			ecs.update(16);
		}
		expect(damageAssignment.components.damageControlAssignment?.progress).toBeGreaterThan(0);
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(damageAssignment.components.damageControlAssignment?.progress).toBeCloseTo(0.5, 0);
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [
				{ type: "goTo", roomId: 4 },
				{ type: "cool", duration: 1 },
			],
		});
		for (let i = 0; i < 60; i++) {
			ecs.update(16);
		}
		expect(damageAssignment.components.damageControlAssignment?.progress).toEqual(1);
	});
	it("should error when given the incorrect instruction", () => {
		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [
				{ type: "goTo", roomId: 4 },
				{ type: "cool", duration: 10 },
			],
		});
		for (let i = 0; i < 600; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.exocomp?.logs.at(-2)?.text).toEqual("No work to do in room.");

		const damageAssignment = new Entity();
		damageAssignment.addComponent("damageControlAssignment", {
			shipId: ship.id,
			systemId: brokenSystem.id,
			requiredAction: { type: "warm", duration: 10 },
		});
		ecs.addEntity(damageAssignment);

		exocomps[0].updateComponent("exocomp", {
			instructionIndex: 0,
			instructions: [{ type: "cool", duration: 10 }],
		});
		for (let i = 0; i < 600; i++) {
			ecs.update(16);
		}
		expect(exocomps[0].components.exocomp?.logs.at(-1)?.text).toEqual(
			"Shields does not require cool.",
		);
	});
});
