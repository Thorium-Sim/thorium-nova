import { threatKnowledge } from "@thorium/.server/ai/threatKnowledge";
import { createMockDataContext } from "@thorium/utils/.server/createMockDataContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";
import { type ECS, Entity } from "@thorium/utils/ecs";
import { describe, expect, it } from "vitest";

describe("threatKnowledge", () => {
	it("should develop a threat assessment for a friendly ship", () => {
		DataStore.operations.run(testDataStoreProps, () => {
			const dataContext = createMockDataContext();
			const ecs = dataContext.ecs;
			const { ship, target } = setUpShipAndTarget(ecs);
			expect(threatKnowledge(ship)?.get(target.id)).toEqual(0);
		});
	});
	it("should develop a threat assessment for a neutral ship", () => {
		DataStore.operations.run(testDataStoreProps, () => {
			const dataContext = createMockDataContext();
			const ecs = dataContext.ecs;
			const { ship, target } = setUpShipAndTarget(ecs);

			const faction = new Entity();
			faction.addComponent("isFaction");
			faction.addComponent("reputation", {
				reputation: { [faction.id.toString()]: 1000 },
			});
			ecs.addEntity(faction);

			target.updateComponent("faction", { factionId: faction.id });

			expect(threatKnowledge(ship)?.get(target.id)).toEqual(0.08881921);
		});
	});
	it("should develop a threat assessment for a hostile ship", () => {
		DataStore.operations.run(testDataStoreProps, () => {
			const dataContext = createMockDataContext();
			const ecs = dataContext.ecs;
			const { ship, target, faction } = setUpShipAndTarget(ecs);

			const hostileFaction = new Entity();
			hostileFaction.addComponent("isFaction");
			hostileFaction.addComponent("reputation", {
				reputation: {
					[hostileFaction.id.toString()]: 1000,
					[faction.id.toString()]: -1000,
				},
			});
			ecs.addEntity(hostileFaction);

			faction.updateComponent("reputation", {
				reputation: {
					...faction.components.reputation?.reputation,
					[hostileFaction.id.toString()]: -1000,
				},
			});

			target.updateComponent("faction", { factionId: hostileFaction.id });

			expect(threatKnowledge(ship)?.get(target.id)).toEqual(0.17763842);
		});
	});
});

function setUpShipAndTarget(ecs: ECS) {
	const faction = new Entity();
	faction.addComponent("isFaction");
	faction.addComponent("reputation", {
		reputation: { [faction.id.toString()]: 1000 },
	});
	ecs.addEntity(faction);

	const target = new Entity();
	target.addComponent("isShip");
	target.addComponent("position", {
		x: 1000,
		y: 10000,
		z: -5000,
		parentId: 1,
		type: "solar",
	});
	target.addComponent("velocity");
	target.addComponent("reputation");
	target.addComponent("faction", { factionId: faction.id });
	ecs.addEntity(target);

	const ship = new Entity();
	ship.addComponent("isShip");
	ship.addComponent("position", {
		x: 0,
		y: 0,
		z: 0,
		parentId: 1,
		type: "solar",
	});
	ship.addComponent("velocity");
	ship.addComponent("reputation");
	ship.addComponent("faction", { factionId: faction.id });
	ship.addComponent("npcKnowledge", {
		activeRange: 100000,
		passiveRange: 1000000,
		alertLevel: "5",
		weaponsRange: 250000,
	});
	ship.addComponent("nearbyObjects", {
		objects: new Map([[target.id, 11180.79]]),
	});
	ship.addComponent("shipSystems", { shipSystems: new Map() });
	ecs.addEntity(ship);

	const shipSensors = new Entity();
	shipSensors.addComponent("isShipSystem", {
		type: "sensors",
		shipId: ship.id,
	});
	shipSensors.addComponent("isSensors");
	ecs.addEntity(shipSensors);

	ship.components.shipSystems?.shipSystems.set(shipSensors.id, {});

	return { ship, target, faction };
}
