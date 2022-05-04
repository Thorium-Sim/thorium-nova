import {shipsPluginInputs, shipSystemsPluginInput} from "../inputs/list";
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
    const {ship, shipSystems} = spawnShip(
      shipPlugin,
      {name: "Spawned Ship", position: {x: 10, y: 20, z: 30}},
      dataContext.server.plugins
    );
    expect(ship.components.identity?.name).toEqual("Spawned Ship");
    expect(ship.components.position?.x).toEqual(10);
    expect(ship.components.position?.y).toEqual(20);
    expect(ship.components.position?.z).toEqual(30);
    expect(shipSystems.length).toEqual(1);
    expect(shipSystems[0].components.identity?.name).toEqual("Generic System");
    expect(shipSystems[0].components.isShipSystem?.type).toEqual("generic");
  });
});
