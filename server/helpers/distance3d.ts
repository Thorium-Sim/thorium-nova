export function distance3d(
  coord2: {x: number; y: number; z: number},
  coord1: {x: number; y: number; z: number}
) {
  const {x: x1, y: y1, z: z1} = coord1;
  let {x: x2, y: y2, z: z2} = coord2;
  return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2 + (z2 -= z1) * z2);
}
