import React from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ColorRepresentation,
  DoubleSide,
} from "three";

function lerp(v0: number, v1: number, t: number) {
  return v0 * (1 - t) + v1 * t;
}

type vec4 = [number, number, number, number];
function makeDiscGeometry(t: any, n: any, i: any, r: any = 128) {
  for (
    var bufferGeometry = new BufferGeometry(),
      a = n.length * r,
      s = 2 * (n.length - 1) * r,
      l = new Float32Array(3 * a),
      c = new Float32Array(3 * a),
      u = new Uint16Array(3 * s),
      h = 0;
    h < n.length;
    h++
  )
    for (
      var d = h * r, f = n[h], p = t.clone().multiplyScalar(i[h]), m = 0;
      r > m;
      m++
    ) {
      var v = 3 * (d + m);
      const g = (2 * Math.PI * m) / r;
      l[v] = f * Math.cos(g);
      l[v + 1] = 0;
      l[v + 2] = f * Math.sin(g);
      c[v] = p.r;
      c[v + 1] = p.g;
      c[v + 2] = p.b;
    }
  for (let h = 0; h < n.length - 1; h++) {
    let d = h * r,
      y = d + r - 1,
      b = d,
      x = 6 * d;
    u[x] = y;
    u[x + 1] = y + r;
    u[x + 2] = b + r;
    u[x + 3] = y;
    u[x + 4] = b + r;
    u[x + 5] = b;
    for (let m = 1; r > m; m++) {
      let y = d + m - 1;
      let b = y + 1;
      let x = 6 * (d + m);
      u[x] = y;
      u[x + 1] = y + r;
      u[x + 2] = b + r;
      u[x + 3] = y;
      u[x + 4] = b + r;
      u[x + 5] = b;
    }
  }
  return (
    bufferGeometry.setAttribute("position", new BufferAttribute(l, 3)),
    bufferGeometry.setAttribute("color", new BufferAttribute(c, 3)),
    bufferGeometry.setIndex(new BufferAttribute(u, 3)),
    bufferGeometry
  );
}

const Disc: React.FC<{
  habitableZoneInner: number;
  habitableZoneOuter: number;
  position?: any;
  scale?: any;
  color?: ColorRepresentation;
}> = ({
  habitableZoneInner,
  habitableZoneOuter,
  color = "rgb(0,55,33)",
  ...props
}) => {
  const geometry = React.useMemo(() => {
    const offset1: vec4 = [
      Math.max(0, lerp(habitableZoneInner, habitableZoneOuter, 0)),
      lerp(habitableZoneInner, habitableZoneOuter, 1),
      lerp(habitableZoneInner, habitableZoneOuter, 0.5),
      lerp(habitableZoneInner, habitableZoneOuter, 0.5),
    ];
    const offset2: vec4 = [0.2, 0.75, 0, 1];
    const geometry = makeDiscGeometry(new Color(color), offset1, offset2);
    return geometry;
  }, [habitableZoneInner, habitableZoneOuter]);
  return (
    <mesh {...props} rotation={[0, Math.PI / 2, 0]} geometry={geometry}>
      <shaderMaterial
        attach="material"
        vertexShader={`attribute vec3 color;
varying vec3 vColor;
varying float vAlpha;
void main() {
	float d = 6.0 * (uv.y - 0.5);
	vec4 wpos = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * wpos;
	vAlpha = 1.0; //max(color.r, max(color.g, color.b));
	vColor = color; //(1.0/vAlpha)*color;
}`}
        fragmentShader={`varying vec3 vColor;
varying float vAlpha;
void main() {
	gl_FragColor = vec4(vColor.rgb, vAlpha);
}`}
        transparent
        blending={AdditiveBlending}
        depthTest={false}
        side={DoubleSide}
      />
    </mesh>
  );
};

export default Disc;
