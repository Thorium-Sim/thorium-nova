import {useFrame} from "@react-three/fiber";
import React, {useEffect} from "react";
import {
  MeshBasicMaterial,
  CanvasTexture,
  BackSide,
  sRGBEncoding,
  BoxBufferGeometry,
  Mesh,
  TextureLoader,
} from "three";
import {useGetStarmapStore} from "../starmapStore";
import NebulaWorker from "./generateNebulaMap?worker";

const radius = 1e20;
const CANVAS_WIDTH = 2048;
let nebulaWorker: Worker | null = null;

const canvas = document.createElement("canvas");
if ("transferControlToOffscreen" in canvas) {
  nebulaWorker = new NebulaWorker();
}

const nebulaGeometry = new BoxBufferGeometry(1, 1, 1);

const sides = ["back", "bottom", "front", "left", "right", "top"];
function generateMaterial(primary: boolean, index: number) {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  canvas.width = canvas.height = CANVAS_WIDTH;

  if ("transferControlToOffscreen" in canvas) {
    // @ts-ignore Built in types don't recognize this property
    const offscreenCanvas = canvas.transferControlToOffscreen();
    offscreenCanvas.width = offscreenCanvas.height = CANVAS_WIDTH;

    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.encoding = sRGBEncoding;

    const material = new MeshBasicMaterial({
      side: BackSide,
      transparent: primary,
      depthWrite: !primary,
      depthTest: false,
      map: canvasTexture,
      userData: {
        offscreenCanvas,
      },
    });
    return material;
  } else {
    const texture = new TextureLoader().load(
      `/assets/skybox/${sides[index]}.png`
    );
    const material = new MeshBasicMaterial({
      side: BackSide,
      transparent: primary,
      depthWrite: !primary,
      depthTest: false,
      map: texture,
    });
    return material;
  }
}

function Nebula() {
  const activeMesh = React.useRef<"primary" | "secondary">("secondary");
  const primaryMesh = React.useRef<Mesh>(null);
  const secondaryMesh = React.useRef<Mesh>(null);

  const [primaryMaterials, secondaryMaterials] = React.useMemo(
    () => [
      Array.from({length: 6}).map((_, index) => generateMaterial(true, index)),
      Array.from({length: 6}).map((_, index) => generateMaterial(false, index)),
    ],
    []
  );

  useEffect(() => {
    if (!nebulaWorker) return;
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
        return () => nebulaWorker?.removeEventListener("message", onMessage);
      }
    }
  }, []);
  const useStarmapStore = useGetStarmapStore();

  const skyboxKey = useStarmapStore(s => s.skyboxKey);
  useEffect(() => {
    nebulaWorker?.postMessage({
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
