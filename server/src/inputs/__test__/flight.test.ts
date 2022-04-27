import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {flightInputs} from "../flight";

describe("flight input", () => {
  it("should start a flight", async () => {
    const mockDataContext = createMockDataContext();
    mockDataContext.database.flight = null;

    expect(mockDataContext.flight).toBeNull();

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
    if (!mockDataContext.flight) throw new Error("No flight created");
    expect(mockDataContext.flight.name).toEqual("Test Flight");
    expect(mockDataContext.flight.ships.length).toEqual(1);
    expect(mockDataContext.flight.ships[0].components.identity?.name).toEqual(
      "Test Ship"
    );
  });
});
