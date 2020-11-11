export function randomFromList<T>(list: T[]) {
  const length = list.length;
  const index = Math.floor(Math.random() * length);
  return list[index];
}
