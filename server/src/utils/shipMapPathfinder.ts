import type {DeckEdge} from "../classes/Plugins/Ship/Deck";
import {PriorityQueue} from "./priorityQueue";

export type ShipMapGraph = Map<number, Map<number, 1>>;
export function createShipMapGraph(edges: {from: number; to: number}[]) {
  const nodes: ShipMapGraph = new Map();
  edges.forEach(edge => {
    if (!nodes.has(edge.from)) nodes.set(edge.from, new Map());
    if (!nodes.has(edge.to)) nodes.set(edge.to, new Map());
    nodes.get(edge.from)?.set(edge.to, 1);
    nodes.get(edge.to)?.set(edge.from, 1);
  });
  // Verify that every node has at least one input and one output.
  for (let node of nodes.keys()) {
    if (nodes.get(node)?.size === 0)
      throw new Error("Node has no outgoing edges");
    // Check to find another node that links to this one
    const otherNode = Array.from(nodes.values()).find(val => val.has(node));
    if (!otherNode) throw new Error("Node has no incoming edges");
  }
  return nodes;
}

// This function was adapted from: https://www.npmjs.com/package/node-dijkstra
export function calculateShipMapPath(
  graph: ShipMapGraph,
  start: number,
  goal: number,
  options = {cost: false, avoid: [], trim: false, reverse: false}
) {
  // Don't run when we don't have nodes set
  if (!graph.size) {
    if (options.cost) return {path: null, cost: 0};

    return null;
  }

  const explored = new Set();
  const frontier = new PriorityQueue<number>();
  const previous = new Map();

  let path = [];
  let totalCost = 0;

  let avoid: number[] = [];
  if (options.avoid) avoid = [].concat(options.avoid);

  if (avoid.includes(start)) {
    throw new Error(`Starting node (${start}) cannot be avoided`);
  } else if (avoid.includes(goal)) {
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
      // Set the total cost to the current value
      totalCost = node.priority;

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
    if (options.cost) return {path: null, cost: 0};

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

  // Return an object if we also want the cost
  if (options.cost) {
    return {
      path,
      cost: totalCost,
    };
  }

  return path;
}