import chroma from "chroma-js";

const SCHEME_ORDER = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const SATURATION_MAP = [0.32, 0.16, 0.08, 0.04, 0, 0, 0.04, 0.08, 0.16, 0.32];
const UNKNOWN_USER_COLOR_STRING = "#000";

const getUserColorChroma = (
  colorString: string,
  fallbackValue = UNKNOWN_USER_COLOR_STRING
) => (chroma.valid(colorString) ? chroma(colorString) : chroma(fallbackValue));

function generateLightnessMap(spread: number, center: number) {
  return Array.from({length: 10}).map((_, i) => {
    return center / 100 + spread / 100 / 2 + (spread / 100) * (4 - i);
  });
}
export default function getColorScheme(
  color: string,
  spread: number = 10,
  center: number = 50
) {
  const trimmedColor = color.trim();
  const userColorChroma = getUserColorChroma(trimmedColor);

  const LIGHTNESS_MAP = generateLightnessMap(spread, center);
  const lightnessGoal = userColorChroma.get("hsl.l");
  const closestLightness = LIGHTNESS_MAP.reduce((prev, curr) =>
    Math.abs(curr - lightnessGoal) < Math.abs(prev - lightnessGoal)
      ? curr
      : prev
  );

  const baseColorIndex = LIGHTNESS_MAP.findIndex(l => l === closestLightness);
  const colors = LIGHTNESS_MAP.map(l => userColorChroma.set("hsl.l", l))
    .map((color, i) => {
      const saturationDelta =
        SATURATION_MAP[i] - SATURATION_MAP[baseColorIndex];
      return saturationDelta >= 0
        ? color.saturate(saturationDelta)
        : color.desaturate(saturationDelta * -1);
    })
    .map(color => color.css())
    .reduce((prev: Record<string, string>, next, i) => {
      prev[SCHEME_ORDER[i]] = next;
      return prev;
    }, {});

  return colors;
}
