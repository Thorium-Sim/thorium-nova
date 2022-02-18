import BasePlugin from "server/src/classes/Plugins";
import ShipPlugin from "server/src/classes/Plugins/Ship";
import {decksPluginInputs} from "../plugins/ships/decks";
import {promises as fs} from "fs";

function createMockDataContext() {
  return {
    flight: null,
    server: {
      plugins: [
        {
          id: "Test Plugin",
          name: "Test Plugin",
          active: true,
          aspects: {
            ships: [
              new ShipPlugin({name: "Test Template"}, {
                name: "Test Plugin",
                aspects: {ships: []},
              } as unknown as BasePlugin),
            ],
          },
        },
      ],
    },
  } as any;
}

describe("ship decks plugin input", () => {
  it("should create a new deck", async () => {
    const mockDataContext = createMockDataContext();

    const shipDeck = decksPluginInputs.pluginShipDeckCreate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(shipDeck).toEqual(0);
    const shipDeck2 = decksPluginInputs.pluginShipDeckCreate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(shipDeck2).toEqual(1);
  });
  it("should delete a deck", async () => {
    const mockDataContext = createMockDataContext();

    const shipDeck = decksPluginInputs.pluginShipDeckCreate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    const shipDeck2 = decksPluginInputs.pluginShipDeckCreate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks.length
    ).toEqual(2);

    decksPluginInputs.pluginShipDeckDelete(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
      index: 0,
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks.length
    ).toEqual(1);
    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[0].name
    ).toEqual("Deck 2");
  });
  it("should update a deck", async () => {
    const mockDataContext = createMockDataContext();

    const shipDeck = decksPluginInputs.pluginShipDeckCreate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    const shipDeck2 = decksPluginInputs.pluginShipDeckCreate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[0].name
    ).toEqual("Deck 1");

    decksPluginInputs.pluginShipDeckUpdate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
      index: 0,
      name: "A Deck",
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[0].name
    ).toEqual("A Deck");

    decksPluginInputs.pluginShipDeckUpdate(mockDataContext, {
      pluginId: "Test Plugin",
      shipId: "Test Template",
      index: 1,
      newIndex: 0,
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[1].name
    ).toEqual("A Deck");
    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[0].name
    ).toEqual("Deck 2");
  });
  afterAll(async () => {
    try {
      await fs.rm("plugins", {recursive: true});
    } catch {}
  });
});
