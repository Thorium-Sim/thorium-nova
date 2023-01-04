export function getQueryKey(
  path: string,
  input: unknown,
): [string] | [string, unknown] {
  return input === undefined || input === null ? [path] : [path, input];
}
