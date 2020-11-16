import React from "react";
import {useFrame, useThree} from "react-three-fiber";
import {
  Matrix4,
  Mesh,
  Vector3,
  Color,
  ShaderMaterial,
  Vector2,
  DoubleSide,
  AdditiveBlending,
  BufferGeometry,
  BufferAttribute,
  Camera,
} from "three";

function makeLineGeometry(pointList: Vector3[]) {
  let a = pointList.length / 2;
  let s = new Float32Array(18 * a);
  let l = new Float32Array(18 * a);
  let c = new Float32Array(12 * a);
  for (let u = 0; a > u; u++) {
    let h = 2 * u;
    let d = 18 * u;
    let f = 12 * u;
    let p = pointList[h];
    let m = pointList[h + 1];
    let v = new Vector3().subVectors(m, p).normalize();

    c[f + 0] = c[f + 2] = c[f + 10] = 0;
    c[f + 6] = c[f + 8] = c[f + 4] = 1;
    c[f + 1] = c[f + 5] = c[f + 9] = 0;

    c[f + 3] = c[f + 7] = c[f + 11] = 1;
    s[d + 0] = s[d + 3] = s[d + 15] = p.x;
    s[d + 1] = s[d + 4] = s[d + 16] = p.y;
    s[d + 2] = s[d + 5] = s[d + 17] = p.z;
    s[d + 6] = s[d + 9] = s[d + 12] = m.x;
    s[d + 7] = s[d + 10] = s[d + 13] = m.y;
    s[d + 8] = s[d + 11] = s[d + 14] = m.z;
    l[d + 0] = l[d + 3] = l[d + 6] = l[d + 9] = l[d + 12] = l[d + 15] = v.x;
    l[d + 1] = l[d + 4] = l[d + 7] = l[d + 10] = l[d + 13] = l[d + 16] = v.y;
    l[d + 2] = l[d + 5] = l[d + 8] = l[d + 11] = l[d + 14] = l[d + 17] = v.z;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(s, 3));
  geometry.setAttribute("normal", new BufferAttribute(l, 3));
  geometry.setAttribute("uv", new BufferAttribute(c, 2));

  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}

const Starfield: React.FC<{count?: number; radius?: number}> = ({
  count = 1500,
  radius = 1500,
}) => {
  const presenceRatio = React.useRef(1);
  const skip = React.useRef(0);

  const mesh = React.useRef<Mesh>();
  const geometry = React.useMemo(() => {
    let pointList: Vector3[] = [];
    for (let f = 0; count > f; f++) {
      const point = new Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      );
      point.normalize();
      const m = Math.random();
      point.multiplyScalar(radius * (1 - m * m * m));
      pointList.push(point.clone());
      pointList.push(point.clone());
    }
    return makeLineGeometry(pointList);
  }, []);

  const {camera} = useThree();
  function getModelViewMatrix() {
    if (!mesh.current) return new Matrix4();
    return new Matrix4().multiplyMatrices(
      camera.matrixWorldInverse,
      mesh.current.matrixWorld
    );
  }

  const material = React.useMemo(() => {
    function makeStarfieldMaterial(
      input: {color1?: string; color2?: string} = {}
    ) {
      const uniforms = {
        color1: {
          type: "c",
          value: input.color1 ? new Color(input.color1) : new Color(1, 1, 1),
        },
        color2: {
          type: "c",
          value: input.color2 ? new Color(input.color2) : new Color(1, 1, 1),
        },
        sizeMin: {
          type: "f",
          value: 1,
        },
        sizeMax: {
          type: "f",
          value: 2,
        },
        intensity: {
          type: "f",
          value: 1,
        },
        time: {
          type: "f",
          value: 0,
        },
        deltaTime: {
          type: "f",
          value: 0.01,
        },
        resolution: {
          type: "v2",
          value: new Vector2(window.innerWidth, window.innerHeight),
        },
        fadeBack: {
          type: "f",
          value: 0,
        },
        radiusAndInvRadius: {
          type: "v2",
          value: new Vector2(4, 0.25),
        },
        fade: {
          type: "v2",
          value: new Vector2(1, 1),
        },
        depth: {
          type: "v2",
          value: new Vector2(0, 1),
        },
        previousModelViewMatrix: {
          type: "m4",
          value: getModelViewMatrix(),
        },
      };
      const material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `uniform vec2 resolution;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float sizeMin;
          uniform float sizeMax;
          uniform float intensity;
          
          uniform mat4 previousModelViewMatrix;
          uniform float time;
          uniform float deltaTime;
          
          //
          ////varying vec2 texcoord;
          varying vec3 texcoord;
          varying vec4 vcolor;
          
          
          float rand(vec2 co){	
              return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          void main() {
              float size = mix(sizeMin,sizeMax, rand(position.xy));
              vec3 color = mix(color1, color2, rand(position.xz));
              float d = 6.0 * (uv.y - 0.5);
              vec3 normal2 = normalize((modelViewMatrix * vec4( position, 1.0 ) - previousModelViewMatrix * vec4( position, 1.0 )).xyz);
              mat4 mvm = uv.x <0.5 ? previousModelViewMatrix : modelViewMatrix;
              vec4 wpos = mvm * vec4( position, 1.0 );
              vec4 wposN = mvm * vec4( position + normal2, 1.0 );
              vec4 vp = projectionMatrix * wpos;
              vec4 vpn = projectionMatrix * wposN;
              float nx = vpn.x*vp.w - vpn.w*vp.x;
              float ny = vpn.y*vp.w - vpn.w*vp.y;
              vec3 t = normalize(vec3(nx, ny, 0));
              gl_Position = vp + vec4(
                  size*1.0*d*vp.w*vec2(t.y/resolution.x, -t.x/resolution.y)
                  + size*3.0*( uv.x >0.5 ? 1.0:-1.0)*vp.w*vec2(t.x/resolution.x, t.y/resolution.y)
                  , 0, 0);
          
              //gl_Position = vp + 20.*vec4(uv.x >0.5 ? 5.0/resolution.x : 0.,
                                  //uv.y <0.5 ? 5.0/resolution.y : 0.,  0.,0.);
              texcoord = vec3(uv.x*vp.w, uv.y*vp.w, vp.w);
          
              vcolor = vec4(color,intensity);
          
          }`,
        fragmentShader: `//varying vec2 texcoord;
          varying vec4 vcolor;
          varying vec3 texcoord;
          uniform vec2 fade;
          uniform vec2 depth;
          
          float lerp(float a, float b, float t) { return (1.0-t)*a + t*b; }
          
          float clamp01(float a) { return a < 0.0? 0.0 : a < 1.0? a : 1.0; }
          
          void main() {
              float UVx = 2.0*(texcoord.x/texcoord.z-0.5);
              float UVy = 2.0*(texcoord.y/texcoord.z-0.5);
              float d = 1.0-length(vec2(UVx,UVy));
              gl_FragColor = vec4(vcolor.rgb, d * vcolor.a);
          }`,
      });
      material.transparent = !0;
      material.side = DoubleSide;
      material.blending = AdditiveBlending;
      material.depthTest = !1;
      return material;
    }
    return makeStarfieldMaterial({
      color1: "#877f76",
      color2: "#96b4cf",
    });
  }, []);

  const time = React.useRef(0);
  const previousModelViewMatrix = React.useRef(getModelViewMatrix());
  useFrame((state, delta) => {
    const mat = mesh.current?.material as ShaderMaterial;
    if (mat) {
      mat.uniforms.previousModelViewMatrix.value.copy(
        previousModelViewMatrix.current
      );
      mat.uniforms.time.value = time.current;
      time.current += delta;
      mat.uniforms.deltaTime.value = delta;
      mat.uniforms.intensity.value = presenceRatio.current;
      previousModelViewMatrix.current = getModelViewMatrix();
    }
    skip.current--;
    if (mesh.current) mesh.current.visible = true;
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      visible={false}
    ></mesh>
  );
};

export default Starfield;
