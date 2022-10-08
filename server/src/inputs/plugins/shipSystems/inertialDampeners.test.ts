import InertialDampenersPlugin from "server/src/classes/Plugins/ShipSystems/InertialDampeners";
import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {shipSystemsPluginInput} from ".";
import {inertialDampenersPluginInput} from "./inertialDampeners";

describe("inertial dampeners plugin input", () => {
  it("should create a new impulse engine system", async () => {
    const dataContext = createMockDataContext();
    const created = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        type: "inertialDampeners",
        name: "Test Inertial Dampeners",
      }
    );

    expect(created).toBeTruthy();
    expect(created.shipSystemId).toEqual("Test Inertial Dampeners");
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];
    if (!(system instanceof InertialDampenersPlugin))
      throw new Error("Not inertial dampeners");
    expect(system.type).toEqual("inertialDampeners");
    expect(system.dampening).toEqual(1);
  });
  it("should update an impulse engine system", async () => {
    const dataContext = createMockDataContext();
    const created = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        type: "inertialDampeners",
        name: "Test Inertial Dampeners",
      }
    );
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];

    if (!(system instanceof InertialDampenersPlugin))
      throw new Error("Not inertial dampeners");
    expect(system.dampening).toEqual(1);
    inertialDampenersPluginInput.pluginInertialDampenersUpdate(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: "Test Inertial Dampeners",
      dampening: 2000,
    });

    expect(system.dampening).toEqual(2000);
  });
});
