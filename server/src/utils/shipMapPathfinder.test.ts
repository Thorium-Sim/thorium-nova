import { createShipMapGraph, calculateShipMapPath } from "./shipMapPathfinder";

describe("ship map pathfinder", () => {
	it("should create a graph", () => {
		const edges = [
			{ from: 1, to: 2 },
			{ from: 1, to: 3 },
			{ from: 2, to: 3 },
			{ from: 2, to: 4 },
			{ from: 3, to: 4 },
			{ from: 3, to: 5 },
		];
		const graph = createShipMapGraph(edges);

		expect(graph.size).toBe(5);
		expect(graph.get(1)?.size).toBe(2);

		expect(calculateShipMapPath(graph, 1, 5)).toMatchInlineSnapshot(`
      [
        1,
        3,
        5,
      ]
    `);
		expect(calculateShipMapPath(graph, 5, 1)).toMatchInlineSnapshot(`
      [
        5,
        3,
        1,
      ]
    `);
		expect(calculateShipMapPath(graph, 3, 2)).toMatchInlineSnapshot(`
      [
        3,
        2,
      ]
    `);
	});
});
