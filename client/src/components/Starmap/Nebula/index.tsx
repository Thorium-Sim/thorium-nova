import {useFrame} from "@react-three/fiber";
import React, {useEffect} from "react";
import {
  MeshBasicMaterial,
  CanvasTexture,
  BackSide,
  sRGBEncoding,
  BoxBufferGeometry,
  Mesh,
} from "three";
import {useGetStarmapStore} from "../starmapStore";
import NebulaWorker from "./generateNebulaMap?worker";

const radius = 1e20;
const CANVAS_WIDTH = 2048;
const nebulaWorker = new NebulaWorker();

const nebulaGeometry = new BoxBufferGeometry(1, 1, 1);

function generateMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = CANVAS_WIDTH;

  // @ts-ignore Built in types don't recognize this property
  const offscreenCanvas = canvas.transferControlToOffscreen();
  offscreenCanvas.width = offscreenCanvas.height = CANVAS_WIDTH;

  const canvasTexture = new CanvasTexture(canvas);
  canvasTexture.encoding = sRGBEncoding;

  const material = new MeshBasicMaterial({
    side: BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    map: canvasTexture,
    userData: {
      offscreenCanvas,
    },
  });
  return material;
}

function Nebula() {
  const activeMesh = React.useRef<"primary" | "secondary">("secondary");
  const primaryMesh = React.useRef<Mesh>(null);
  const secondaryMesh = React.useRef<Mesh>(null);

  const [primaryMaterials, secondaryMaterials] = React.useMemo(
    () => [
      Array.from({length: 6}).map(generateMaterial),
      Array.from({length: 6}).map(generateMaterial),
    ],
    []
  );
  useEffect(() => {
    if (primaryMesh.current && secondaryMesh.current) {
      if (
        Array.isArray(primaryMesh.current.material) &&
        Array.isArray(secondaryMesh.current.material)
      ) {
        const primaryCanvases = primaryMesh.current.material.map(
          m => m.userData.offscreenCanvas
        );
        const secondaryCanvases = secondaryMesh.current.material.map(
          m => m.userData.offscreenCanvas
        );
        nebulaWorker.postMessage(
          {type: "init", primaryCanvases, secondaryCanvases},
          primaryCanvases.concat(secondaryCanvases)
        );

        function onMessage(e: MessageEvent) {
          let materials: MeshBasicMaterial[] = [];
          if (e.data.which === "primary") {
            materials = primaryMesh.current!.material as MeshBasicMaterial[];
          } else {
            materials = secondaryMesh.current!.material as MeshBasicMaterial[];
          }
          setTimeout(() => {
            materials.forEach(m => {
              if (m.map) {
                m.map.needsUpdate = true;
              }
            });
            activeMesh.current = e.data.which;
          }, 500);
        }
        nebulaWorker.addEventListener("message", onMessage);
        return () => nebulaWorker.removeEventListener("message", onMessage);
      }
    }
  }, []);
  const useStarmapStore = useGetStarmapStore();

  const skyboxKey = useStarmapStore(s => s.skyboxKey);
  useEffect(() => {
    nebulaWorker.postMessage({
      type: "render",
      seed: skyboxKey,
      which: activeMesh.current === "primary" ? "secondary" : "primary",
    });
  }, [skyboxKey]);

  useFrame((state, delta) => {
    if (Array.isArray(primaryMesh.current?.material)) {
      const primaryMat = primaryMesh.current
        ?.material?.[0] as MeshBasicMaterial;
      if (activeMesh.current === "primary" && primaryMat.opacity < 1) {
        primaryMesh.current?.material.forEach(mat => {
          mat.opacity = Math.min(1, mat.opacity + delta / 3);
        });
      } else if (activeMesh.current === "secondary" && primaryMat.opacity > 0) {
        primaryMesh.current?.material.forEach(mat => {
          mat.opacity = Math.max(0, mat.opacity - delta / 3);
        });
      }
    }
  });

  // Always center the nebula on the camera
  useFrame(({camera}) => {
    primaryMesh.current?.position.copy(camera.position);
    secondaryMesh.current?.position.copy(camera.position);
  });
  return (
    <>
      <mesh
        ref={primaryMesh}
        geometry={nebulaGeometry}
        scale={radius}
        renderOrder={-100}
        dispose={null}
        material={primaryMaterials}
      ></mesh>
      <mesh
        ref={secondaryMesh}
        geometry={nebulaGeometry}
        scale={radius + 10}
        renderOrder={-101}
        dispose={null}
        material={secondaryMaterials}
      ></mesh>
    </>
  );
}

export default Nebula;
