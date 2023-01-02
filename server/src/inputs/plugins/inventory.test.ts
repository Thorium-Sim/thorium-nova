import InventoryPlugin from "@server/classes/Plugins/Inventory";
import {
  createMockDataContext,
  createMockRouter,
} from "@server/utils/createMockDataContext";

describe("inventory plugin input", () => {
  it("should create a new inventory object", async () => {
    const dataContext = createMockDataContext();
    const router = createMockRouter(dataContext);
    const created = await router.plugin.inventory.create({
      pluginId: "Test Plugin",
      name: "Test Inventory",
    });

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
    const router = createMockRouter(dataContext);

    const created = await router.plugin.inventory.create({
      pluginId: "Test Plugin",
      name: "Test Inventory",
    });
    const inventory = dataContext.server.plugins[0].aspects.inventory[0];

    if (!(inventory instanceof InventoryPlugin))
      throw new Error("Not inventory");
    expect(inventory.continuous).toEqual(false);
    await router.plugin.inventory.update({
      pluginId: "Test Plugin",
      inventoryId: "Test Inventory",
      continuous: true,
    });
    expect(inventory.continuous).toEqual(true);

    await router.plugin.inventory.update({
      pluginId: "Test Plugin",
      inventoryId: "Test Inventory",
      continuous: false,
    });
    expect(inventory.continuous).toEqual(false);

    expect(inventory.volume).toEqual(1);
    await router.plugin.inventory.update({
      pluginId: "Test Plugin",
      inventoryId: "Test Inventory",
      volume: 50,
    });
    expect(inventory.volume).toEqual(50);
  });
});
