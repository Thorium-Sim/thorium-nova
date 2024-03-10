import { DeckNode } from "../classes/Plugins/Ship/Deck";
import { PriorityQueue } from "./priorityQueue";

export type ShipMapGraph = Map<number, Map<number, number>>;
export function createShipMapGraph(
	edges: { from: number; to: number }[],
	inputNodes: { x: number; y: number; id: number }[] = [],
) {
	const nodes: ShipMapGraph = new Map();
	const nodeMap = new Map(inputNodes.map(({ id, x, y }) => [id, { x, y }]));
	edges.forEach((edge) => {
		if (!nodes.has(edge.from)) nodes.set(edge.from, new Map());
		if (!nodes.has(edge.to)) nodes.set(edge.to, new Map());
		const fromNode = nodeMap.get(edge.from);
		const toNode = nodeMap.get(edge.to);
		let distance = 1;
		if (fromNode && toNode) {
			distance = Math.sqrt(
				(fromNode.x - toNode.x) ** 2 + (fromNode.y - toNode.y) ** 2,
			);
		}
		nodes.get(edge.from)?.set(edge.to, distance);
		nodes.get(edge.to)?.set(edge.from, distance);
	});
	// Verify that every node has at least one input and one output.
	for (const node of nodes.keys()) {
		if (nodes.get(node)?.size === 0)
			throw new Error("Node has no outgoing edges");
		// Check to find another node that links to this one
		const otherNode = Array.from(nodes.values()).find((val) => val.has(node));
		if (!otherNode) throw new Error("Node has no incoming edges");
	}
	return nodes;
}

// This function was adapted from: https://www.npmjs.com/package/node-dijkstra
export function calculateShipMapPath(
	graph: ShipMapGraph,
	start: number,
	goal: number,
	options: {
		avoid?: [];
		trim?: boolean;
		reverse?: boolean;
	} = {
		avoid: [],
		trim: false,
		reverse: false,
	},
): number[] | null {
	// Don't run when we don't have nodes set
	if (!graph.size) {
		return null;
	}

	const explored = new Set();
	const frontier = new PriorityQueue<number>();
	const previous = new Map();

	let path = [];

	let avoid: number[] = [];
	if (options.avoid) avoid = [].concat(options.avoid);

	if (avoid.includes(start)) {
		throw new Error(`Starting node (${start}) cannot be avoided`);
	}
	if (avoid.includes(goal)) {
		throw new Error(`Ending node (${goal}) cannot be avoided`);
	}

	// Add the starting point to the frontier, it will be the first node visited
	frontier.set(start, 0);

	// Run until we have visited every node in the frontier
	while (!frontier.isEmpty()) {
		// Get the node in the frontier with the lowest cost (`priority`)
		const node = frontier.next();

		// When the node with the lowest cost in the frontier in our goal node,
		// we can compute the path and exit the loop
		if (node.key === goal) {
			let nodeKey = node.key;
			while (previous.has(nodeKey)) {
				path.push(nodeKey);
				nodeKey = previous.get(nodeKey);
			}

			break;
		}

		// Add the current node to the explored set
		explored.add(node.key);

		// Loop all the neighboring nodes
		const neighbors = graph.get(node.key) || new Map();
		neighbors.forEach((nCost, nNode) => {
			// If we already explored the node, or the node is to be avoided, skip it
			if (explored.has(nNode) || avoid.includes(nNode)) return null;

			// If the neighboring node is not yet in the frontier, we add it with
			// the correct cost
			if (!frontier.has(nNode)) {
				previous.set(nNode, node.key);
				return frontier.set(nNode, node.priority + nCost);
			}

			const frontierPriority = frontier.get(nNode).priority;
			const nodeCost = node.priority + nCost;

			// Otherwise we only update the cost of this node in the frontier when
			// it's below what's currently set
			if (nodeCost < frontierPriority) {
				previous.set(nNode, node.key);
				return frontier.set(nNode, nodeCost);
			}

			return null;
		});
	}

	// Return null when no path can be found
	if (!path.length) {
		return null;
	}

	// From now on, keep in mind that `path` is populated in reverse order,
	// from destination to origin

	// Remove the first value (the goal node) if we want a trimmed result
	if (options.trim) {
		path.shift();
	} else {
		// Add the origin waypoint at the end of the array
		path = path.concat([start]);
	}

	// Reverse the path if we don't want it reversed, so the result will be
	// from `start` to `goal`
	if (!options.reverse) {
		path = path.reverse();
	}

	return path;
}
