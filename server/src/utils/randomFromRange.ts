export function randomFromRange(
  {min, max}: Range<number>,
  precision: number = 5
): number {
  return (
    Math.round((Math.random() * (max - min) + min) * Math.pow(10, precision)) /
    Math.pow(10, precision)
  );
}

export type Range<Type extends number> = {min: Type; max: Type};
