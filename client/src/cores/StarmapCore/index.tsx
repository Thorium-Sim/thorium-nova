import {InterstellarMap} from "client/src/components/Starmap/InterstellarMap";
import useCardData from "client/src/context/useCardData";
import SystemMarker from "client/src/components/Starmap/SystemMarker";
import StarmapCanvas from "client/src/components/Starmap/StarmapCanvas";
import {useContext, useEffect, useMemo, useRef} from "react";
import {useStarmapStore} from "client/src/components/Starmap/starmapStore";
import {Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import type {Entity} from "server/src/utils/ecs";
import {useGLTF, useTexture} from "@react-three/drei";
import {
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

export function StarmapCore() {
  const {starmapSystems, starmapShips} = useCardData<"StarmapCore">();

  useEffect(() => {
    useStarmapStore.setState({viewingMode: "core"});
  }, []);
  console.log(useStarmapStore(state => state.selectedObjectId));
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
    console.log(context?.SI.calcInterpolation("x y z"));
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
        <group ref={shipSprite}>
          {props.components.isShip?.assets.logo && (
            <ShipSprite
              id={props.id}
              color={"white"}
              spriteAsset={props.components.isShip?.assets.logo}
            />
          )}
        </group>
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

const ShipSprite = ({
  id,
  color = "white",
  spriteAsset,
}: {
  id: string | number;
  color?: string;
  spriteAsset: string;
}) => {
  // TODO: Replace with a ship icon
  const spriteMap = useTexture(spriteAsset);
  const scale = 1 / 25;
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
        map={spriteMap}
        color={color}
        sizeAttenuation={false}
      ></spriteMaterial>
    </sprite>
  );
};
