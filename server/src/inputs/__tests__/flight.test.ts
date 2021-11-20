import {flightInputs} from "../flight";
import fs from "fs/promises";

describe("flight input", () => {
  it("should start a flight", async () => {
    const mockDataContext = {
      flight: null,
      server: {
        plugins: [
          {
            id: "Test Plugin",
            name: "Test Plugin",
            active: true,
            aspects: {
              ships: [
                {
                  name: "Test Template",
                },
              ],
            },
          },
        ],
      },
    } as any;
    const flight = await flightInputs.flightStart(mockDataContext, {
      flightName: "Test Flight",
      ships: [
        {
          shipName: "Test Ship",
          shipTemplate: {pluginId: "Test Plugin", shipId: "Test Template"},
          crewCount: 1,
        },
      ],
    });
    expect(mockDataContext.flight).toBeDefined();
    expect(mockDataContext.flight.name).toEqual("Test Flight");
    expect(mockDataContext.flight.ships.length).toEqual(1);
    expect(mockDataContext.flight.ships[0].components.identity.name).toEqual(
      "Test Ship"
    );
    await fs.rm("./flights", {recursive: true});
  });
});
