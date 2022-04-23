import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {Entity} from "server/src/utils/ecs";
import {clientInputs} from "../client";

describe("Client input", () => {
  it("should assign to a client and station", async () => {
    const mockDataContext = createMockDataContext();
    expect(
      clientInputs.clientSetStation(mockDataContext, {
        shipId: 1,
        stationId: "Test",
      })
    ).rejects.toThrowError("No ship with that ID exists");

    if (!mockDataContext.flight) throw new Error("No flight");

    const ship = mockDataContext.flight.ecs.addEntity(
      new Entity(1, {
        isShip: {shipClass: "Test", category: "Test", registry: "", assets: {}},
        isPlayerShip: {value: true},
        stationComplement: {
          stations: [
            {
              name: "Test",
              apiVersion: "stations/v1",
              kind: "stations",
              description: "",
              logo: "",
              theme: "",
              tags: [],
              cards: [],
            },
          ],
        },
      })
    );
    await clientInputs.clientSetStation(mockDataContext, {
      shipId: 1,
      stationId: "Test",
    });
    expect(mockDataContext.flight.clients.test.stationId).toBe("Test");
  });
});
