import {promises as fs} from "fs";
import {
  createMockDataContext,
  createMockRouter,
} from "@server/utils/createMockDataContext";

describe("ship decks plugin input", () => {
  it("should create a new deck", async () => {
    const mockDataContext = createMockDataContext();
    const router = createMockRouter(mockDataContext);
    const shipDeck = await router.plugin.ship.deck.create({
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(shipDeck).toEqual({backgroundUrl: "", name: "Deck 1", nodes: []});
    const shipDeck2 = await router.plugin.ship.deck.create({
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(shipDeck2).toEqual({backgroundUrl: "", name: "Deck 2", nodes: []});
  });
  it("should delete a deck", async () => {
    const mockDataContext = createMockDataContext();
    const router = createMockRouter(mockDataContext);

    const shipDeck = await router.plugin.ship.deck.create({
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    const shipDeck2 = await router.plugin.ship.deck.create({
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks.length
    ).toEqual(2);

    await router.plugin.ship.deck.delete({
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
    const router = createMockRouter(mockDataContext);
    const shipDeck = await router.plugin.ship.deck.create({
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    const shipDeck2 = await router.plugin.ship.deck.create({
      pluginId: "Test Plugin",
      shipId: "Test Template",
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[0].name
    ).toEqual("Deck 1");

    await router.plugin.ship.deck.update({
      pluginId: "Test Plugin",
      shipId: "Test Template",
      deckId: "Deck 1",
      newName: "A Deck",
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[0].name
    ).toEqual("A Deck");

    await router.plugin.ship.deck.update({
      pluginId: "Test Plugin",
      shipId: "Test Template",
      deckId: "A Deck",
      newIndex: 1,
    });

    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[1].name
    ).toEqual("A Deck");
    expect(
      mockDataContext.server.plugins[0].aspects.ships[0].decks[0].name
    ).toEqual("Deck 2");
  });

  describe("Deck Nodes", () => {
    it("should create a few new deck nodes", async () => {
      const mockDataContext = createMockDataContext();
      const router = createMockRouter(mockDataContext);

      const shipDeck = await router.plugin.ship.deck.create({
        pluginId: "Test Plugin",
        shipId: "Test Template",
      });
      const deck = mockDataContext.server.plugins[0].aspects.ships[0].decks[0];
      expect(deck.nodes.length).toEqual(0);
      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 50,
        y: 50,
      });

      expect(deck.nodes.length).toEqual(1);
      expect(deck.nodes[0].x).toEqual(50);
      expect(deck.nodes[0].y).toEqual(50);
      expect(deck.nodes[0].id).toEqual(1);

      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 100,
        y: 100,
      });

      expect(deck.nodes.length).toEqual(2);
      expect(deck.nodes[1].x).toEqual(100);
      expect(deck.nodes[1].y).toEqual(100);
      expect(deck.nodes[1].id).toEqual(2);
    });
    it("should delete a deck node", async () => {
      const mockDataContext = createMockDataContext();
      const router = createMockRouter(mockDataContext);

      const shipDeck = await router.plugin.ship.deck.create({
        pluginId: "Test Plugin",
        shipId: "Test Template",
      });
      const deck = mockDataContext.server.plugins[0].aspects.ships[0].decks[0];
      expect(deck.nodes.length).toEqual(0);

      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 50,
        y: 50,
      });

      expect(deck.nodes.length).toEqual(1);
      expect(deck.nodes[0].x).toEqual(50);
      expect(deck.nodes[0].y).toEqual(50);
      expect(deck.nodes[0].id).toEqual(1);
      await router.plugin.ship.deck.removeNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        nodeId: 1,
      });

      expect(deck.nodes.length).toEqual(0);
    });
    it("should update a deck node", async () => {
      const mockDataContext = createMockDataContext();
      const router = createMockRouter(mockDataContext);

      const shipDeck = await router.plugin.ship.deck.create({
        pluginId: "Test Plugin",
        shipId: "Test Template",
      });
      const deck = mockDataContext.server.plugins[0].aspects.ships[0].decks[0];
      expect(deck.nodes.length).toEqual(0);

      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 50,
        y: 50,
      });

      expect(deck.nodes.length).toEqual(1);
      expect(deck.nodes[0].x).toEqual(50);
      expect(deck.nodes[0].y).toEqual(50);
      expect(deck.nodes[0].id).toEqual(1);

      await router.plugin.ship.deck.updateNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        nodeId: 1,
        x: 100,
        y: 100,
      });

      expect(deck.nodes.length).toEqual(1);
      expect(deck.nodes[0].x).toEqual(100);
      expect(deck.nodes[0].y).toEqual(100);
      expect(deck.nodes[0].id).toEqual(1);

      expect(deck.nodes[0].isRoom).toEqual(false);
      await router.plugin.ship.deck.updateNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        nodeId: 1,
        isRoom: true,
      });
      expect(deck.nodes[0].isRoom).toEqual(true);

      expect(deck.nodes[0].flags).toEqual([]);
      await router.plugin.ship.deck.updateNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        nodeId: 1,
        flags: ["cargo"],
      });
      expect(deck.nodes[0].flags).toEqual(["cargo"]);

      expect(deck.nodes[0].name).toEqual("");
      await router.plugin.ship.deck.updateNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        nodeId: 1,
        name: "Test Node",
      });
      expect(deck.nodes[0].name).toEqual("Test Node");

      expect(deck.nodes[0].radius).toEqual(0);
      await router.plugin.ship.deck.updateNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        nodeId: 1,
        radius: 10,
      });
      expect(deck.nodes[0].radius).toEqual(10);

      expect(deck.nodes[0].volume).toEqual(12);
      await router.plugin.ship.deck.updateNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        nodeId: 1,
        volume: 20,
      });
      expect(deck.nodes[0].volume).toEqual(20);
    });
  });
  describe("Deck Edges", () => {
    it("should create a deck edge", async () => {
      const mockDataContext = createMockDataContext();
      const router = createMockRouter(mockDataContext);

      await router.plugin.ship.deck.create({
        pluginId: "Test Plugin",
        shipId: "Test Template",
      });
      const ship = mockDataContext.server.plugins[0].aspects.ships[0];
      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 50,
        y: 50,
      });
      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 100,
        y: 50,
      });
      expect(ship.deckEdges.length).toEqual(0);

      await router.plugin.ship.deck.addEdge({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        from: 2,
        to: 1,
      });

      expect(ship.deckEdges.length).toEqual(1);
      expect(ship.deckEdges[0].to).toEqual(1);
      expect(ship.deckEdges[0].from).toEqual(2);
      expect(ship.deckEdges[0].id).toEqual(1);
    });
    it("should delete a deck edge", async () => {
      const mockDataContext = createMockDataContext();
      const router = createMockRouter(mockDataContext);

      await router.plugin.ship.deck.create({
        pluginId: "Test Plugin",
        shipId: "Test Template",
      });
      const ship = mockDataContext.server.plugins[0].aspects.ships[0];
      expect(ship.deckEdges.length).toEqual(0);

      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 50,
        y: 50,
      });
      await router.plugin.ship.deck.addNode({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        deckId: "Deck 1",
        x: 100,
        y: 50,
      });
      expect(ship.deckEdges.length).toEqual(0);

      await router.plugin.ship.deck.addEdge({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        from: 2,
        to: 1,
      });

      expect(ship.deckEdges.length).toEqual(1);
      await router.plugin.ship.deck.removeEdge({
        pluginId: "Test Plugin",
        shipId: "Test Template",
        edgeId: 1,
      });
      expect(ship.deckEdges.length).toEqual(0);
    });
  });
  afterAll(async () => {
    try {
      await fs.rm("plugins", {recursive: true});
    } catch {}
  });
});
