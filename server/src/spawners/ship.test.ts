import {
  decksPluginInputs,
  shipsPluginInputs,
  shipSystemsPluginInput,
} from "../inputs/list";
import {createMockDataContext} from "../utils/createMockDataContext";
import {spawnShip} from "./ship";
describe("Ship Spawner", () => {
  it("should spawn a ship from a template", async () => {
    const dataContext = createMockDataContext();
    const shipSystem = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        name: "Generic System",
        type: "generic",
      }
    );
    const createdShip = shipsPluginInputs.pluginShipCreate(dataContext, {
      pluginId: "Test Plugin",
      name: "Test Ship",
    });

    const shipDeck = decksPluginInputs.pluginShipDeckCreate(dataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Ship",
    });

    const {id} = decksPluginInputs.pluginShipDeckAddNode(dataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Ship",
      deckId: "Deck 1",
      x: 50,
      y: 50,
    });
    decksPluginInputs.pluginShipDeckUpdateNode(dataContext, {
      deckId: "Deck 1",
      shipId: "Test Ship",
      pluginId: "Test Plugin",
      nodeId: id,
      isRoom: true,
    });

    shipsPluginInputs.pluginShipToggleSystem(dataContext, {
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
    expect(extraEntities.length).toEqual(6);
    expect(extraEntities[0].components.identity?.name).toEqual(
      "Generic System"
    );
    expect(extraEntities[0].components.isShipSystem?.type).toEqual("generic");
    expect(extraEntities[1].components.cargoContainer?.volume).toEqual(12);
    expect(extraEntities[1].components.isRoom).toBeTruthy();
    expect(extraEntities[2].components.isRoom).toBeFalsy();
    expect(extraEntities[2].components.cargoContainer?.volume).toEqual(4);
  });
});
