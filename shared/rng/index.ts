import prand, {RandomGenerator} from "pure-rand";
const maxNum = 0xffffffff;

export {prand};

export function skipN(rng: RNG, num: number): RNG {
  let cur = rng.rng;
  for (let idx = 0; idx !== num; ++idx) {
    let nextOut = cur.next();
    cur = nextOut[1];
  }
  rng.setRNG(cur);
  return rng;
}

export interface RNG {
  next: () => number;
  nextInt: (min: number, max: number) => number;
  nextFromList: <T>(list: T[]) => T;
  nextBoolean: () => boolean;
  nextChar: (input?: string) => string;
  nextString: (length?: number, input?: string) => string;
  setRNG: (rng: RandomGenerator) => void;
  rng: RandomGenerator;
  iterationCount: number;
  seed: string | number;
}
function getSafeSeed(seed: number): number {
  if (seed === 0) return 1;
  return seed;
}
function xorshift(value: number): number {
  // Xorshift*32
  // Based on George Marsaglia's work: http://www.jstatsoft.org/v08/i14/paper
  value ^= value << 13;
  value ^= value >> 17;
  value ^= value << 5;
  return value;
}
function hashCode(str: string): number {
  let hash = 0;
  if (str) {
    const l = str.length;
    for (let i = 0; i < l; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
      hash = xorshift(hash);
    }
  }
  return getSafeSeed(hash);
}
/**
 * Creates a random number generator
 * @param seed The random seed for the random number generator.
 * @param skip The number of iterations of the random number generator to
 */
export function createRNG(seed: number | string, skip = 0): RNG {
  let newSeed = typeof seed === "string" ? hashCode(seed) : seed;
  let rng = prand.mersenne(newSeed);
  rng = prand.skipN(rng, skip);
  return {
    rng,
    iterationCount: skip,
    seed,
    setRNG: function setRNG(newRng: RandomGenerator) {
      rng = newRng;
    },
    next: function next() {
      const [value, next] = rng.next();
      rng = next;
      this.iterationCount++;
      return value / maxNum;
    },
    nextInt: function nextInt(min, max) {
      const [value, next] = prand.uniformIntDistribution(min, max)(rng);
      rng = next;
      this.iterationCount++;
      return value;
    },
    nextFromList: function nextFromList(list) {
      const length = list.length;
      const value = this.next();
      const index = Math.floor(value * length);
      return list[index];
    },
    nextBoolean: function nextBoolean(): boolean {
      const value = this.next();
      return value > 0.5;
    },
    nextChar(
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ): string {
      return chars.substr(this.nextInt(0, chars.length - 1), 1);
    },
    nextString(
      length = 16,
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ): string {
      let str = "";
      while (str.length < length) {
        str += this.nextChar(chars);
      }
      return str;
    },
  };
}
