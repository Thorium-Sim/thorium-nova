export function logslider(
  zoomMin: number,
  zoomMax: number,
  position: number,
  reverse?: boolean
) {
  // position will be between 0 and 100
  var minP = 0;
  var maxP = 100;

  // The result should be between 100 an 10000000
  var minV = Math.log(zoomMin);
  var maxV = Math.log(zoomMax);

  // calculate adjustment factor
  var scale = (maxV - minV) / (maxP - minP);
  if (reverse) return (Math.log(position) - minV) / scale + minP;
  return Math.exp(minV + scale * (position - minP));
}
