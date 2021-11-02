import {sanitizeRegex} from "server/src/utils/sanitizeRegex";

export function generateIncrementedName(name: string, names: string[]) {
  const regex = new RegExp(`${sanitizeRegex(name)}( \\((\\d*)\\))?$`, "g");
  if (!names.includes(name)) return name;
  const matchingNames = names
    .map(name => {
      const match = name.matchAll(regex).next().value;
      if (!match) return -1;
      return parseInt(match[2], 10) || 0;
    })
    .filter(val => val && val !== -1);
  if (matchingNames.length === 0) return name;
  const max = matchingNames.reduce((acc, cur) => Math.max(acc, cur), 0);
  return `${name} (${max + 1})`;
}
