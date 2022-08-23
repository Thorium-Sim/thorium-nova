import {degreeLerp, lerp, radianLerp} from "../src/lerp";

test("lerp should be 0.5", () => {
  expect(lerp(0, 1, 0.5)).toBe(0.5);
});

test("degreeLerp should be 90", () => {
  expect(degreeLerp(0, 180, 0.5)).toBe(90);
});

test("degreeLerp should be -22.5", () => {
  expect(degreeLerp(-360, -45, 0.5)).toBe(-22.5);
});

test("degreeLerp should be 230", () => {
  expect(degreeLerp(540, 270, 0.5)).toBe(225);
});

test("radianLerp should be Math.PI * 0.75", () => {
  expect(radianLerp(Math.PI * 0.5, Math.PI * 1, 0.5)).toBe(Math.PI * 0.75);
});

test("radianLerp should be ~-Math.PI / 16", () => {
  const rad = radianLerp(-2 * Math.PI, -Math.PI / 8, 0.5).toFixed(4);
  const res = (-Math.PI / 16).toFixed(4);
  expect(rad).toBe(res);
});

test("radianLerp should be ~-Math.PI / 16", () => {
  const rad = radianLerp(3 * Math.PI, (Math.PI * 3) / 2, 0.5).toFixed(4);
  const res = ((Math.PI / 4) * 5).toFixed(4);
  expect(rad).toBe(res);
});
