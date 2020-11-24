export function randomFromList<T>(list: T[]) {
  const length = list.length;
  const index = Math.floor(Math.random() * length);
  return list[index];
}
export function duplicateList<T>(list: T[], count: number) {
  let output: T[] = [];
  for (let i = 0; i < count; i++) {
    output = output.concat(list);
  }
  return output;
}
export function concat<T>(...args: T[]) {
  return args.reduce((prev: T[], next) => prev.concat(next), []);
}
