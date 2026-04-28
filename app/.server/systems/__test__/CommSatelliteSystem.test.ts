import { CommSatelliteSystem } from "@thorium/.server/systems/CommSatelliteSystem";
import { pickNextLongRangeMessageNode } from "@thorium/cards/LongRangeComm/data.server";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { ECS, Entity } from "@thorium/utils/ecs";
import { lightMinuteToLightYear } from "@thorium/utils/unitTypes";
import { aroundEach, beforeEach, describe, expect, it } from "vitest";

aroundEach(async (runTest) => {
	await DataStore.operations.run(testDataStoreProps, async () => {
		await runTest();
	});
});

function buildSatellite(
	position: [number, number, number],
	radius: number,
	isPlayerShip?: boolean,
) {
	const satellite = new Entity();
	if (isPlayerShip) {
		satellite.addComponent("isPlayerShip", { value: true });
	}
	satellite.addComponent("position", {
		x: position[0],
		y: position[1],
		z: position[2],
		parentId: null,
		type: "interstellar",
	});
	satellite.addComponent("isCommSatellite", { radius });

	return satellite;
}

function buildSatelliteEntities(ecs: ECS) {
	const satellite1 = buildSatellite([-10, 0, 0], lightMinuteToLightYear(5));
	ecs.addEntity(satellite1);
	const satellite2 = buildSatellite([-7, 0, 0], lightMinuteToLightYear(10));
	ecs.addEntity(satellite2);
	const satellite3 = buildSatellite([0, 3, 0], lightMinuteToLightYear(7));
	ecs.addEntity(satellite3);
	const satellite4 = buildSatellite([0, -5, 0], lightMinuteToLightYear(7), true);
	ecs.addEntity(satellite4);
	const satellite5 = buildSatellite([4, 0, 0], lightMinuteToLightYear(5));
	ecs.addEntity(satellite5);
	return [satellite1, satellite2, satellite3, satellite4, satellite5];
}

describe("CommSatelliteSystem", () => {
	let ecs: ECS;
	let commSatelliteSystem: CommSatelliteSystem;
	let senderShip: Entity;
	let destinationShip: Entity;
	let satellites: Entity[];
	beforeEach(() => {
		const mockDataContext = createMockDataContext();
		ecs = new ECS(mockDataContext.server);
		commSatelliteSystem = new CommSatelliteSystem();
		ecs.addSystem(commSatelliteSystem);
		satellites = buildSatelliteEntities(ecs);

		senderShip = new Entity();
		senderShip.addComponent("position", {
			x: -12,
			y: 0,
			z: 0,
			parentId: null,
			type: "interstellar",
		});
		ecs.addEntity(senderShip);
		destinationShip = new Entity();
		destinationShip.addComponent("position", {
			x: 4,
			y: 0,
			z: 0,
			parentId: null,
			type: "interstellar",
		});
		ecs.addEntity(destinationShip);
	});
	it("should send a message from the sender to the destination", () => {
		satellites[3].removeComponent("isPlayerShip");
		const message = new Entity();
		const nextNodeId = pickNextLongRangeMessageNode(ecs, satellites[0].id, destinationShip.id, []);
		message.addComponent("isLongRangeMessage", {
			destinationId: destinationShip.id,
			senderId: senderShip.id,
			state: "sending",
			transmissionSpeed: lightMinuteToLightYear(0.1),
			nextNodeId,
		});
		message.addComponent("position", {
			x: -11,
			y: 0,
			z: 0,
			parentId: null,
			type: "interstellar",
		});
		ecs.addEntity(message);

		expect(message.components.position?.x).toEqual(-11);

		ecs.update(16);

		expect(message.components.position?.x).toBeGreaterThan(-11);
		expect(message.components.position?.x).toBeLessThan(-10);
		expect(message.components.position?.y).toEqual(0);
		expect(message.components.position?.z).toEqual(0);

		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[0].id);
		for (let i = 0; i < 30 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[1].id);
		for (let i = 0; i < 30 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[2].id);
		expect(message.components.position?.x).toBeCloseTo(-5.383);
		expect(message.components.position?.y).toBeCloseTo(0.6926);

		for (let i = 0; i < 90 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[4].id);
		expect(message.components.position?.x).toBeCloseTo(2.224);
		expect(message.components.position?.y).toBeCloseTo(1.331);
		expect(message.components.isLongRangeMessage?.state).toEqual("sending");

		for (let i = 0; i < 90 * 60; i++) {
			ecs.update(16);
		}

		expect(message.components.isLongRangeMessage?.state).toEqual("delivered");
	});
	it("should send a message and be intercepted by the player ship satellite", () => {
		const message = new Entity();
		const nextNodeId = pickNextLongRangeMessageNode(ecs, satellites[0].id, destinationShip.id, []);
		message.addComponent("isLongRangeMessage", {
			destinationId: destinationShip.id,
			senderId: senderShip.id,
			state: "sending",
			transmissionSpeed: lightMinuteToLightYear(0.1),
			nextNodeId,
		});
		message.addComponent("position", {
			x: -11,
			y: 0,
			z: 0,
			parentId: null,
			type: "interstellar",
		});
		ecs.addEntity(message);

		expect(message.components.position?.x).toEqual(-11);

		ecs.update(16);

		expect(message.components.position?.x).toBeGreaterThan(-11);
		expect(message.components.position?.x).toBeLessThan(-10);
		expect(message.components.position?.y).toEqual(0);
		expect(message.components.position?.z).toEqual(0);

		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[0].id);
		for (let i = 0; i < 30 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[1].id);
		for (let i = 0; i < 30 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[3].id);
		expect(message.components.position?.x).toBeCloseTo(-5.569);
		expect(message.components.position?.y).toBeCloseTo(-1.022);

		for (let i = 0; i < 90 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.state).toEqual("intercepted");
		expect(message.components.isLongRangeMessage?.interceptorId).toEqual(satellites[3].id);

		// Simulate sending the message along after its been intercepted
		message.updateComponent("isLongRangeMessage", {
			state: "sending",
			interceptorId: null,
			nextNodeId: satellites[4].id,
		});

		for (let i = 0; i < 30 * 60; i++) {
			ecs.update(16);
		}

		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[4].id);
		expect(message.components.position?.x).toBeCloseTo(1.799);
		expect(message.components.position?.y).toBeCloseTo(-2.751);
		expect(message.components.isLongRangeMessage?.state).toEqual("sending");

		for (let i = 0; i < 90 * 60; i++) {
			ecs.update(16);
		}

		expect(message.components.isLongRangeMessage?.state).toEqual("delivered");
	});
	it("should fail to send a message if the destination is outside the satellite network", () => {
		destinationShip.updateComponent("position", { x: 100 });
		satellites[3].removeComponent("isPlayerShip");
		const message = new Entity();
		const nextNodeId = pickNextLongRangeMessageNode(ecs, satellites[0].id, destinationShip.id, []);
		message.addComponent("isLongRangeMessage", {
			destinationId: destinationShip.id,
			senderId: senderShip.id,
			state: "sending",
			transmissionSpeed: lightMinuteToLightYear(0.1),
			nextNodeId,
		});
		message.addComponent("position", {
			x: -11,
			y: 0,
			z: 0,
			parentId: null,
			type: "interstellar",
		});
		ecs.addEntity(message);

		expect(message.components.position?.x).toEqual(-11);

		ecs.update(16);

		expect(message.components.position?.x).toBeGreaterThan(-11);
		expect(message.components.position?.x).toBeLessThan(-10);
		expect(message.components.position?.y).toEqual(0);
		expect(message.components.position?.z).toEqual(0);

		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[0].id);
		for (let i = 0; i < 30 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[1].id);
		for (let i = 0; i < 30 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[2].id);
		expect(message.components.position?.x).toBeCloseTo(-5.383);
		expect(message.components.position?.y).toBeCloseTo(0.6926);

		for (let i = 0; i < 90 * 60; i++) {
			ecs.update(16);
		}
		expect(message.components.isLongRangeMessage?.nextNodeId).toEqual(satellites[4].id);
		expect(message.components.position?.x).toBeCloseTo(2.224);
		expect(message.components.position?.y).toBeCloseTo(1.331);
		expect(message.components.isLongRangeMessage?.state).toEqual("sending");

		for (let i = 0; i < 90 * 60; i++) {
			ecs.update(16);
		}

		expect(message.components.isLongRangeMessage?.state).toEqual("undelivered");
	});
});
