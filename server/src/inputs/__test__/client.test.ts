import {
  createMockDataContext,
  createMockRouter,
} from "@server/utils/createMockDataContext";
import {Entity} from "@server/utils/ecs";

describe("Client input", () => {
  it("should assign to a client and station", async () => {
    const mockDataContext = createMockDataContext();
    const router = createMockRouter(mockDataContext);
    await expect(
      router.client.setStation({
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
              description: "",
              logo: "",
              theme: "",
              tags: [],
              cards: [],
              widgets: [],
            },
          ],
        },
      })
    );
    await router.client.setStation({
      shipId: 1,
      stationId: "Test",
    });
    expect(mockDataContext.flight.clients.test.stationId).toBe("Test");
  });
});
