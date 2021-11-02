export function sanitizeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
