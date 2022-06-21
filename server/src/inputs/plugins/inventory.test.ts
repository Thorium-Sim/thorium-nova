import InventoryPlugin from "server/src/classes/Plugins/Inventory";
import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {pluginInventoryInputs} from "./inventory";

describe("inventory plugin input", () => {
  it("should create a new inventory object", async () => {
    const dataContext = createMockDataContext();
    const created = await pluginInventoryInputs.pluginInventoryCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        name: "Test Inventory",
      }
    );

    expect(created).toBeTruthy();
    expect(created.inventoryId).toEqual("Test Inventory");
    const inventory = dataContext.server.plugins[0].aspects.inventory[0];
    if (!(inventory instanceof InventoryPlugin))
      throw new Error("Not inventory");
    expect(inventory.name).toEqual("Test Inventory");
    expect(inventory.continuous).toEqual(false);
  });
  it("should update an inventory object", async () => {
    const dataContext = createMockDataContext();
    const created = await pluginInventoryInputs.pluginInventoryCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        name: "Test Inventory",
      }
    );
    const inventory = dataContext.server.plugins[0].aspects.inventory[0];

    if (!(inventory instanceof InventoryPlugin))
      throw new Error("Not inventory");
    expect(inventory.continuous).toEqual(false);
    pluginInventoryInputs.pluginInventoryUpdate(dataContext, {
      pluginId: "Test Plugin",
      inventoryId: "Test Inventory",
      continuous: true,
    });
    expect(inventory.continuous).toEqual(true);

    pluginInventoryInputs.pluginInventoryUpdate(dataContext, {
      pluginId: "Test Plugin",
      inventoryId: "Test Inventory",
      continuous: false,
    });
    expect(inventory.continuous).toEqual(false);

    expect(inventory.volume).toEqual(1);
    pluginInventoryInputs.pluginInventoryUpdate(dataContext, {
      pluginId: "Test Plugin",
      inventoryId: "Test Inventory",
      volume: 50,
    });
    expect(inventory.volume).toEqual(50);
  });
});
