import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {shipSystemsPluginInput} from ".";

describe("ship systems plugin input", () => {
  it("should create a new ship system", async () => {
    const dataContext = createMockDataContext();
    const shipSystem = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        name: "Generic System",
        type: "generic",
      }
    );

    expect(shipSystem).toBeDefined();
    expect(shipSystem.shipSystemId).toEqual("Generic System");
    expect(dataContext.server.plugins[0].aspects.shipSystems[0].type).toEqual(
      "generic"
    );
  });
  it("should delete a ship system", async () => {
    const dataContext = createMockDataContext();
    const shipSystem = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        name: "Generic System",
        type: "generic",
      }
    );
    const shipSystem2 = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        name: "Generic System",
        type: "generic",
      }
    );

    expect(dataContext.server.plugins[0].aspects.shipSystems.length).toEqual(2);
    expect(shipSystem2.shipSystemId).toEqual("Generic System (1)");

    await shipSystemsPluginInput.pluginShipSystemDelete(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: shipSystem.shipSystemId,
    });

    expect(dataContext.server.plugins[0].aspects.shipSystems.length).toEqual(1);
    expect(dataContext.server.plugins[0].aspects.shipSystems[0].name).toEqual(
      "Generic System (1)"
    );
  });
  it("should update a ship system", async () => {
    const dataContext = createMockDataContext();
    const shipSystem = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        name: "Generic System",
        type: "generic",
      }
    );

    expect(shipSystem.shipSystemId).toEqual("Generic System");
    expect(dataContext.server.plugins[0].aspects.shipSystems[0].type).toEqual(
      "generic"
    );

    const updated = await shipSystemsPluginInput.pluginShipSystemUpdate(
      dataContext,
      {
        pluginId: "Test Plugin",
        shipSystemId: shipSystem.shipSystemId,
        name: "New Name",
      }
    );

    expect(dataContext.server.plugins[0].aspects.shipSystems[0].name).toEqual(
      "New Name"
    );

    expect(
      dataContext.server.plugins[0].aspects.shipSystems[0].description
    ).toEqual("");
    await shipSystemsPluginInput.pluginShipSystemUpdate(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: updated.shipSystemId,
      description: "New Description",
    });
  });
});
