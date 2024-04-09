export function randomFromRange(
	{ min, max }: Range<number>,
	precision = 5,
): number {
	return (
		Math.round((Math.random() * (max - min) + min) * 10 ** precision) /
		10 ** precision
	);
}

export type Range<Type extends number> = { min: Type; max: Type };
