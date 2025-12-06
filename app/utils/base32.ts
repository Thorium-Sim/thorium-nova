const chars = [
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"j",
	"k",
	"m",
	"n",
	"p",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
];

export function toBase32(number: number): string {
	const sign = Math.sign(number);
	const digit = Math.trunc(Math.abs(number) % chars.length);
	const overflow = Math.trunc(Math.abs(number) / chars.length);
	return `${sign < 0 ? "-1" : ""}${overflow > 0 ? toBase32(overflow) : ""}${chars[digit]}`;
}
