import ThrustersPlugin from "server/src/classes/Plugins/ShipSystems/Thrusters";
import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {shipSystemsPluginInput} from ".";
import {thrustersPluginInput} from "./thrusters";

describe("thrusters plugin input", () => {
  it("should create a new thrusters system", async () => {
    const dataContext = createMockDataContext();
    const created = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        type: "thrusters",
        name: "Test Thrusters",
      }
    );

    expect(created).toBeTruthy();
    expect(created.shipSystemId).toEqual("Test Thrusters");
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];
    if (!(system instanceof ThrustersPlugin)) throw new Error("Not thrusters");
    expect(system.type).toEqual("thrusters");
    expect(system.directionMaxSpeed).toEqual(1);
  });
  it("should update a thrusters system", async () => {
    const dataContext = createMockDataContext();
    const created = await shipSystemsPluginInput.pluginShipSystemCreate(
      dataContext,
      {
        pluginId: "Test Plugin",
        type: "thrusters",
        name: "Test Thrusters",
      }
    );
    const system = dataContext.server.plugins[0].aspects.shipSystems[0];

    thrustersPluginInput.pluginThrustersUpdate(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: "Test Thrusters",
      directionMaxSpeed: 5,
    });
    if (!(system instanceof ThrustersPlugin)) throw new Error("Not thrusters");
    expect(system.directionMaxSpeed).toEqual(5);

    expect(system.rotationMaxSpeed).toEqual(5);
    thrustersPluginInput.pluginThrustersUpdate(dataContext, {
      pluginId: "Test Plugin",
      shipSystemId: "Test Thrusters",
      rotationMaxSpeed: 2,
    });
    expect(system.rotationMaxSpeed).toEqual(2);
  });
});
