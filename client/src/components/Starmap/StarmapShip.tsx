import {useMemo, useRef} from "react";
import {Suspense} from "react";
import {Line, useGLTF} from "@react-three/drei";
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
import {createAsset} from "use-asset";
import {useGetStarmapStore} from "./starmapStore";
import {Line2} from "three-stdlib";
import {q} from "@client/context/AppContext";
import {useLiveQuery} from "@thorium/live-query/client";

export function StarmapShip({
  id,
  modelUrl,
  logoUrl,
  spriteColor = "white",
  onClick,
}: {
  id: number;
  modelUrl?: string;
  logoUrl?: string;
  spriteColor?: number | string;
  onClick?: () => void;
}) {
  const model = useShipModel(modelUrl);

  const useStarmapStore = useGetStarmapStore();

  const systemId = useStarmapStore(store => store.currentSystem);

  const [autopilotData] = q.starmapCore.autopilot.useNetRequest({systemId});

  const shipAutopilot = autopilotData[id];

  const [player] = q.ship.player.useNetRequest();
  const playerId = player?.id;

  const isNotViewscreen = useStarmapStore(
    store => store.viewingMode !== "viewscreen"
  );
  const isCore = useStarmapStore(store => store.viewingMode === "core");

  const group = useRef<Group>(null);
  const shipMesh = useRef<Group>(null);
  const shipSprite = useRef<Group>(null);
  const {interpolate} = useLiveQuery();
  const lineRef = useRef<Line2>(null);
  useFrame(() => {
    if (!group.current) return;
    const state = interpolate(id);
    if (!state) {
      group.current.visible = false;
      return;
    }
    group.current.visible = true;
    group.current.position.set(state.x, state.y, state.z);
    shipMesh.current?.quaternion.set(
      state.r.x,
      state.r.y,
      state.r.z,
      state.r.w
    );
    if (shipMesh.current) {
      if (!isNotViewscreen && playerId === id) {
        shipMesh.current.visible = false;
      } else {
        shipMesh.current.visible = true;
      }
    }

    // Autopilot Destination
    if (lineRef.current && group.current) {
      if (
        isCore &&
        // TODO September 14, 2022 - Make it so you can toggle autopilot lines on and off
        // useConfigStore.getState().includeAutopilotData &&
        shipAutopilot?.destinationPosition
      ) {
        const destinationPosition = player.currentSystem
          ? shipAutopilot.destinationPosition
          : shipAutopilot.destinationSystemPosition ||
            shipAutopilot.destinationPosition;

        lineRef.current.geometry.setPositions([
          group.current.position.x,
          group.current.position.y,
          group.current.position.z,
          destinationPosition.x,
          destinationPosition.y,
          destinationPosition.z,
        ]);
        lineRef.current.geometry.attributes.position.needsUpdate = true;
        lineRef.current.visible = true;
      } else {
        lineRef.current.visible = false;
      }
    }
  });
  return (
    <group>
      <Line
        ref={lineRef}
        points={[
          [1, 1, 1],
          [2, 2, 2],
        ]} // Array of points
        color="white"
        opacity={0.25}
        transparent
        lineWidth={0.5} // In pixels (default)
      />
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
        onClick={onClick}
      >
        {isNotViewscreen && (
          <Suspense fallback={null}>
            <group ref={shipSprite}>
              {logoUrl && (
                <ShipSprite
                  id={id}
                  // TODO June 9, 2022 - This color should represent the faction, with a toggle to make it show IFF for the current ship
                  color={spriteColor}
                  spriteAsset={logoUrl}
                />
              )}
            </group>
          </Suspense>
        )}
        {model && (
          <group ref={shipMesh}>
            <primitive object={model} rotation={[Math.PI / 2, Math.PI, 0]} />
          </group>
        )}
      </group>
    </group>
  );
}

function useShipModel(modelAsset: string | undefined) {
  let model = useGLTF(modelAsset || "/assets/Empty.glb", false);
  const scene = useMemo(() => {
    if (!model) return new Object3D();

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

  if (!modelAsset) return null;

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
  color?: string | number;
  spriteAsset: string;
}) => {
  // TODO: Replace with a ship icon
  const spriteMap = maskTextureAsset.read(spriteAsset);

  const scale = 1 / 50;
  const ref = useRef<Sprite>(null);
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
