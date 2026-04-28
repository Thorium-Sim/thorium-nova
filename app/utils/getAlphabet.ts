export function getAlphabet(index: number): string {
	if (index > 26) return `${getAlphabet(Math.floor(index / 26))}${getAlphabet(index % 26)}`;
	return String.fromCharCode(index + 65);
}
