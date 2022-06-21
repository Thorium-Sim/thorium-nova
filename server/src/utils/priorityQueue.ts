// This was taken from https://www.npmjs.com/package/node-dijkstra
/**
 * This very basic implementation of a priority queue is used to select the
 * next node of the graph to walk to.
 *
 * The queue is always sorted to have the least expensive node on top.
 * Some helper methods are also implemented.
 *
 * You should **never** modify the queue directly, but only using the methods
 * provided by the class.
 */
export class PriorityQueue<T> {
  keys: Set<T>;
  private queue: {priority: number; key: T}[];
  /**
   * Creates a new empty priority queue
   */
  constructor() {
    // The `keys` set is used to greatly improve the speed at which we can
    // check the presence of a value in the queue
    this.keys = new Set();
    this.queue = [];
  }

  /**
   * Sort the queue to have the least expensive node to visit on top
   *
   * @private
   */
  sort() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Sets a priority for a key in the queue.
   * Inserts it in the queue if it does not already exists.
   *
   * @param {any}     key       Key to update or insert
   * @param {number}  value     Priority of the key
   * @return {number} Size of the queue
   */
  set(key: T, value: number): number {
    const priority = Number(value);
    if (isNaN(priority)) throw new TypeError('"priority" must be a number');

    if (!this.keys.has(key)) {
      // Insert a new entry if the key is not already in the queue
      this.keys.add(key);
      this.queue.push({key, priority});
    } else {
      // Update the priority of an existing key
      this.queue.map(element => {
        if (element.key === key) {
          Object.assign(element, {priority});
        }

        return element;
      });
    }

    this.sort();
    return this.queue.length;
  }

  /**
   * The next method is used to dequeue a key:
   * It removes the first element from the queue and returns it
   *
   * @return {object} First priority queue entry
   */
  next() {
    const element = this.queue.shift() as {priority: number; key: T};
    // Remove the key from the `_keys` set
    this.keys.delete(element.key);

    return element;
  }

  /**
   * @return {boolean} `true` when the queue is empty
   */
  isEmpty() {
    return Boolean(this.queue.length === 0);
  }

  /**
   * Check if the queue has a key in it
   *
   * @param {any} key   Key to lookup
   * @return {boolean}
   */
  has(key: T) {
    return this.keys.has(key);
  }

  /**
   * Get the element in the queue with the specified key
   *
   * @param {any} key   Key to lookup
   * @return {object}
   */
  get(key: T) {
    return this.queue.find(element => element.key === key) as {
      priority: number;
      key: T;
    };
  }
}
