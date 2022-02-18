export function moveArrayItem<T>(
  array: T[],
  old_index: number,
  new_index: number
) {
  if (new_index >= array.length) {
    let k = new_index - array.length;
    while (k-- + 1) {
      array.push(undefined as unknown as T);
    }
  }
  array.splice(new_index, 0, array.splice(old_index, 1)[0]);
  return array; // for testing purposes
}
