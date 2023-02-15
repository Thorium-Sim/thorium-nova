import {
  createMockDataContext,
  createMockRouter,
} from "../utils/createMockDataContext";
import {spawnShip} from "./ship";
describe("Ship Spawner", () => {
  it("should spawn a ship from a template", async () => {
    const dataContext = createMockDataContext();
    const router = createMockRouter(dataContext);

    const shipSystem = await router.plugin.systems.create({
      pluginId: "Test Plugin",
      name: "Generic System",
      type: "generic",
    });
    const createdShip = await router.plugin.ship.create({
      pluginId: "Test Plugin",
      name: "Test Ship",
    });

    const shipDeck = await router.plugin.ship.deck.create({
      pluginId: "Test Plugin",
      shipId: "Test Ship",
    });

    const {id} = await router.plugin.ship.deck.addNode({
      pluginId: "Test Plugin",
      shipId: "Test Ship",
      deckId: "Deck 1",
      x: 50,
      y: 50,
    });
    await router.plugin.ship.deck.updateNode({
      deckId: "Deck 1",
      shipId: "Test Ship",
      pluginId: "Test Plugin",
      nodeId: id,
      isRoom: true,
      flags: ["cargo"],
    });

    await router.plugin.ship.toggleSystem({
      pluginId: "Test Plugin",
      shipId: createdShip.shipId,
      systemPlugin: "Test Plugin",
      systemId: shipSystem.shipSystemId,
    });

    const shipPlugin = dataContext.server.plugins
      .find(p => p.name === "Test Plugin")
      ?.aspects.ships.find(s => s.name === "Test Ship");
    expect(shipPlugin).toBeDefined();
    if (!shipPlugin) throw new Error("Ship not found");
    const {ship, extraEntities} = spawnShip(dataContext, shipPlugin, {
      name: "Spawned Ship",
      position: {x: 10, y: 20, z: 30, type: "interstellar", parentId: null},
      playerShip: true,
    });
    expect(ship.components.identity?.name).toEqual("Spawned Ship");
    expect(ship.components.position?.x).toEqual(10);
    expect(ship.components.position?.y).toEqual(20);
    expect(ship.components.position?.z).toEqual(30);
    expect(extraEntities.length).toEqual(10);
    expect(extraEntities[5].components.identity?.name).toEqual(
      "Generic System"
    );
    expect(extraEntities[5].components.isShipSystem?.type).toEqual("generic");
    expect(extraEntities[6].components.cargoContainer?.volume).toEqual(4000);
    expect(extraEntities[7].components.cargoContainer?.volume).toEqual(4000);
  });
});
