import {createMockDataContext} from "@server/utils/createMockDataContext";
import {ECS, Entity} from "@server/utils/ecs";
import {PowerEfficiencyOverloadSystem} from "../PowerEfficiencyOverloadSystem";

describe("PowerEfficiencyOverloadSystem", () => {
  let ecs: ECS;
  let system: Entity;
  beforeEach(() => {
    const mockDataContext = createMockDataContext();

    ecs = new ECS(mockDataContext.server);
    ecs.addSystem(new PowerEfficiencyOverloadSystem());
    system = new Entity();
    system.addComponent("power");
    system.addComponent("efficiency");
    ecs.addEntity(system);
  });
  it("should slowly decrease when power is below the maxSafePower", () => {
    expect(system.components.power?.maxSafePower).toEqual(20);
    expect(system.components.power?.currentPower).toEqual(10);
    expect(system.components.efficiency?.efficiency).toEqual(1);
    for (let i = 0; i < 60; i++) {
      ecs.update(16);
    }

    expect(system.components.efficiency?.efficiency).toMatchInlineSnapshot(
      `0.9999881658398825`
    );

    // The average mission length
    for (let i = 0; i < 60 * 60 * 60 * 2; i++) {
      ecs.update(16);
    }

    expect(system.components.efficiency?.efficiency).toMatchInlineSnapshot(
      `0.9136407160588623`
    );
  });
  it("should decrease when power is above maxSafePower", () => {
    expect(system.components.power?.maxSafePower).toEqual(20);
    expect(system.components.efficiency?.efficiency).toEqual(1);

    let system2 = new Entity();
    system2.addComponent("power");
    system2.addComponent("efficiency");
    ecs.addEntity(system2);
    system2.updateComponent("power", {currentPower: 24});

    // It should run for 5 minutes at 20%
    for (let i = 0; i < 60 * 60 * 5; i++) {
      ecs.update(16);
    }

    expect(
      system.components.efficiency!.efficiency >
        system2.components.efficiency!.efficiency
    );
    expect(system2.components.efficiency!.efficiency).toMatchInlineSnapshot(
      `0.13240845929025086`
    );
  });
});
