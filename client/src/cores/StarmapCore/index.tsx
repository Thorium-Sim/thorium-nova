import {InterstellarMap} from "client/src/components/Starmap/InterstellarMap";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {useContext, useEffect, useMemo, useRef} from "react";
import {useStarmapStore} from "client/src/components/Starmap/starmapStore";
import {Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import type {Entity} from "server/src/utils/ecs";
import {useGLTF, useTexture} from "@react-three/drei";
import {
  CanvasTexture,
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Sprite,
} from "three";
import {useFrame} from "@react-three/fiber";
import {ThoriumContext} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useDataStream} from "client/src/context/useDataStream";
import {createAsset} from "use-asset";

export function StarmapCore() {
  const starmapShips = useNetRequest("starmapShips");
  const starmapSystems = useNetRequest("starmapSystems");

  useDataStream({});
  useEffect(() => {
    useStarmapStore.setState({viewingMode: "core"});
  }, []);

  return (
    <StarmapCanvas>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <InterstellarMap>
        {starmapSystems.map(sys =>
          sys.components.position && sys.components.identity ? (
            <SystemMarker
              key={sys.id}
              systemId={sys.id}
              position={
                [
                  sys.components.position.x,
                  sys.components.position.y,
                  sys.components.position.z,
                ] as [number, number, number]
              }
              name={sys.components.identity.name}
              onClick={() =>
                useStarmapStore.setState({selectedObjectId: sys.id})
              }
            />
          ) : null
        )}
        {starmapShips.map(ship =>
          ship.components.position && ship.components.isShip ? (
            <Suspense key={ship.id} fallback={null}>
              <ErrorBoundary
                FallbackComponent={() => <></>}
                onError={err => console.error(err)}
              >
                <StarmapShip {...ship} />
              </ErrorBoundary>
            </Suspense>
          ) : null
        )}
      </InterstellarMap>
    </StarmapCanvas>
  );
}

function StarmapShip(props: Pick<Entity, "id" | "components">) {
  const model = useShipModel(props.components.isShip?.assets.model);

  const group = useRef<Group>();
  const shipMesh = useRef<Group>();
  const shipSprite = useRef<Group>();
  const context = useContext(ThoriumContext);
  // const lineRef = useRef<Line2>(null);

  useFrame(() => {
    if (!group.current) return;
    const state = context?.interpolate(props.id);
    if (!state) {
      group.current.visible = false;
      return;
    }
    group.current.visible = true;
    group.current.position.set(state.x, state.y, state.z);
  });
  return (
    <group>
      {/*
  TODO May 24, 2022 - This is for autopilot destination lines
  <Line
    ref={lineRef}
    points={[
      [1, 1, 1],
      [2, 2, 2],
    ]} // Array of points
    color="white"
    opacity={0.2}
    transparent
    lineWidth={0.25} // In pixels (default)
  /> */}
      <group
        ref={group}
        onPointerOver={() => {
          // set the cursor to pointer
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          // set the cursor to default
          document.body.style.cursor = "default";
        }}
        // TODO May 24, 2022 - This is for making it possible to drag ships around
        // {...functions}
        // onPointerDown={e => {
        //   if (e.metaKey || e.shiftKey) {
        //     useSelectedShips.setState(({selectedIds}) => ({
        //       selectedIds: selectedIds.includes(entity.id)
        //         ? selectedIds.filter(e => e !== entity.id)
        //         : selectedIds.concat(entity.id),
        //     }));
        //   } else {
        //     if (!useSelectedShips.getState().selectedIds.includes(entity.id)) {
        //       useSelectedShips.setState({selectedIds: [entity.id]});
        //     }
        //   }
        //   useConfigStore.getState().disableOrbitControls();

        //   document.addEventListener(
        //     "mouseup",
        //     () => {
        //       useConfigStore.getState().enableOrbitControls();
        //     },
        //     {once: true}
        //   );
        //   functions.onPointerDown?.(e);
        // }}
      >
        <Suspense fallback={null}>
          <group ref={shipSprite}>
            {props.components.isShip?.assets.logo && (
              <ShipSprite
                id={props.id}
                color={"red"}
                spriteAsset={props.components.isShip?.assets.logo}
              />
            )}
          </group>
        </Suspense>
        <group ref={shipMesh}>
          {/* <axesHelper args={[3]} /> */}
          <primitive object={model} rotation={[Math.PI / 2, Math.PI, 0]} />
        </group>
      </group>
    </group>
  );
}

function useShipModel(modelAsset: string | undefined) {
  if (!modelAsset) throw new Error("Invalid ship model");
  const model = useGLTF(modelAsset || "", false);

  const scene = useMemo(() => {
    const scene: Object3D = model.scene.clone(true);
    if (scene.traverse) {
      scene.traverse(function (object: Object3D | Mesh) {
        if ("material" in object) {
          const material = object.material as MeshStandardMaterial;
          material.emissiveMap = material.map;
          material.emissiveIntensity = 0.3;
          material.emissive = new Color(0xffffff);
          material.side = FrontSide;

          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    }

    return scene;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelAsset]);

  return scene;
}

const maskTextureAsset = createAsset(async image => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      if (!ctx) return reject();
      const scale = 4;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(
        0,
        0,
        img.width * scale,
        img.height * scale
      );
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3];
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve();
    };
  });
  return new CanvasTexture(canvas);
});

const ShipSprite = ({
  id,
  color = "red",
  spriteAsset,
}: {
  id: string | number;
  color?: string;
  spriteAsset: string;
}) => {
  // TODO: Replace with a ship icon
  const spriteMap = maskTextureAsset.read(spriteAsset);
  useTexture;
  const scale = 1 / 50;
  const ref = useRef<Sprite>();
  useFrame(() => {
    const isSelected = false;
    // TODO May 24 2022 - this is used for showing that a ship is selected.
    // const isSelected = useSelectedShips.getState().selectedIds.includes(id);
    if (isSelected) {
      ref.current?.material.color.set("#0088ff");
    } else {
      ref.current?.material.color.set(color);
    }
  });
  return (
    <sprite ref={ref} scale={[scale, scale, scale]}>
      <spriteMaterial
        attach="material"
        alphaMap={spriteMap}
        color={color}
        sizeAttenuation={false}
        needsUpdate={true}
      ></spriteMaterial>
    </sprite>
  );
};
