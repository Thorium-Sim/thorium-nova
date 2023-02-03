export function cargoSort(
  [keyA]: [string, {count: number}],
  [keyB]: [string, {count: number}]
) {
  return keyA.localeCompare(keyB);
}
