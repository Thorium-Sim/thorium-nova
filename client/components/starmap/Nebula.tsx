import React from "react";
import {
  MeshBasicMaterial,
  CanvasTexture,
  BackSide,
  sRGBEncoding,
  Color,
  BoxBufferGeometry,
  Mesh,
} from "three";
import uniqid from "uniqid";
import {configStoreApi} from "./configStore";
import {useFrame} from "react-three-fiber";

const radius = 1000000;

const nebulaWorker = new Worker("./generateNebulaMap.js");
const promiseCache: {[key: string]: (value?: unknown) => void} = {};
function onMessage(e: MessageEvent) {
  promiseCache[e.data.id]?.();
}
nebulaWorker.onmessage = onMessage;

async function generateNebula(skyboxKey: string) {
  const textures = generateBlank();
  await new Promise(resolve => {
    const id = uniqid();
    promiseCache[id] = resolve;
    nebulaWorker.postMessage(
      {seed: skyboxKey, textures: textures.offscreen, id},
      Object.values(textures.offscreen)
    );
  });
  return textures;
}

export async function generateTextures(skyboxKey: string) {
  const textures = await generateNebula(skyboxKey);
  const maps: HTMLCanvasElement[] = [];

  maps.push(textures.onscreen.front);
  maps.push(textures.onscreen.back);
  maps.push(textures.onscreen.top);
  maps.push(textures.onscreen.bottom);
  maps.push(textures.onscreen.left);
  maps.push(textures.onscreen.right);

  const tx = maps.map(m => {
    const tx = new CanvasTexture(m);
    tx.encoding = sRGBEncoding;
    return tx;
  });
  return tx;
}
function generateBlank() {
  const canvases: {[key: string]: HTMLCanvasElement} = {
    front: document.createElement("canvas"),
    back: document.createElement("canvas"),
    top: document.createElement("canvas"),
    bottom: document.createElement("canvas"),
    left: document.createElement("canvas"),
    right: document.createElement("canvas"),
  };
  const offscreen: {[key: string]: OffscreenCanvas} = {};
  for (let canvas in canvases) {
    canvases[canvas].width = canvases[canvas].height = 256;
    offscreen[canvas] = canvases[canvas].transferControlToOffscreen();
    offscreen[canvas].width = offscreen[canvas].height = 256;
  }
  return {onscreen: canvases, offscreen};
}

const nebulaGeometry = new BoxBufferGeometry(1, 1, 1);

function Nebula() {
  const skyboxKey = React.useRef("");
  const primaryMesh = React.useRef<Mesh>();
  const secondaryMesh = React.useRef<Mesh>();
  const meshes = React.useRef({active: primaryMesh, inactive: secondaryMesh});
  async function regenerateNebula(skyboxKey: string) {
    const textures = await generateTextures(skyboxKey);
    if (meshes.current.inactive.current && meshes.current.active.current) {
      // Let's clean up any existing objects;
      if (Array.isArray(meshes.current.inactive.current?.material)) {
        meshes.current.inactive.current?.material?.forEach((m, i) => {
          const mat = m as MeshBasicMaterial;
          mat.map?.dispose();
          mat.color.set(0xffffff);
          mat.map = textures[i];
          mat.transparent = true;
          mat.needsUpdate = true;
        });
      }

      meshes.current = {
        active: meshes.current.inactive,
        inactive: meshes.current.active,
      };
    }
  }
  useFrame((state, delta) => {
    const key = configStoreApi.getState().skyboxKey;
    if (skyboxKey.current !== key) {
      skyboxKey.current = key;
      regenerateNebula(key);
    }
    if (Array.isArray(primaryMesh.current?.material)) {
      const primaryMat = primaryMesh.current
        ?.material?.[0] as MeshBasicMaterial;
      if (
        primaryMesh.current === meshes.current.active.current &&
        primaryMat.opacity < 1
      ) {
        primaryMesh.current?.material.forEach(mat => {
          mat.opacity = Math.min(1, mat.opacity + delta / 3);
        });
      } else if (
        primaryMesh.current === meshes.current.inactive.current &&
        primaryMat.opacity > 0
      ) {
        primaryMesh.current?.material.forEach(mat => {
          mat.opacity = Math.max(0, mat.opacity - delta / 3);
        });
      }
    }
  });

  return (
    <>
      <mesh
        ref={secondaryMesh}
        geometry={nebulaGeometry}
        scale={[radius + 10, radius + 10, radius + 10]}
        renderOrder={-101}
      >
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
      </mesh>
      <mesh
        ref={primaryMesh}
        geometry={nebulaGeometry}
        scale={[radius, radius, radius]}
        renderOrder={-100}
      >
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
        <meshBasicMaterial attachArray="material" side={BackSide} />
      </mesh>
    </>
  );
}

export default Nebula;
