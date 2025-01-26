export function logslider(
	zoomMin: number,
	zoomMax: number,
	position: number,
	reverse?: boolean,
) {
	// position will be between 0 and 100
	const minP = 0;
	const maxP = 100;

	// The result should be between 100 an 10000000
	const minV = Math.log(zoomMin);
	const maxV = Math.log(zoomMax);

	// calculate adjustment factor
	const scale = (maxV - minV) / (maxP - minP);
	if (reverse) return (Math.log(position) - minV) / scale + minP;
	return Math.exp(minV + scale * (position - minP));
}
