import {
  TemplateSystemSubscription,
  UniverseStarSetIsWhiteDocument,
  useTemplateSystemSubscription,
  useUniverseStarbaseSetPositionMutation,
} from "../../generated/graphql";
import React, {Suspense} from "react";
import {useThree} from "react-three-fiber";
import {
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  MOUSE,
  Object3D,
  Vector3,
} from "three";
import StarEntity from "./entities/StarEntity";
import PlanetContainer from "./entities/PlanetEntity";
import Disc from "./Disc";
import {configStoreApi, useConfigStore} from "./configStore";
import {OrbitControls} from "./OrbitControls";
import {PLANETARY_SCALE} from "./constants";
import {useGLTFLoader} from "drei";
import {whiteImage} from "./utils";
import Selected from "./entities/Selected";
import useObjectDrag from "./hooks/useObjectDrag";

const ShipStarmapEntity: React.FC<{
  entity: TemplateSystemSubscription["pluginUniverseSystem"]["items"][0];
}> = ({entity}) => {
  const modelAsset = entity.shipAssets?.model;
  const model = useGLTFLoader(modelAsset || whiteImage, false);
  const scene = React.useMemo(() => {
    const scene: Group = model.scene.clone(true);
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

  const [setPosition] = useUniverseStarbaseSetPositionMutation();
  const scale = (entity.size?.value || 1) * 5;
  const {position, rotation} = entity;
  const selected = useConfigStore(
    store => store.selectedObject?.id === entity.id
  );
  const container = React.useRef<Group>();
  const bind = useObjectDrag(container, {
    onMouseDown: () => {
      configStoreApi.getState().disableOrbitControls();
      if (configStoreApi.getState().viewingMode === "viewscreen") return;
      if (configStoreApi.getState().viewingMode === "core") return;
      const positionVector = new Vector3(
        position?.x || 0,
        position?.y || 0,
        position?.z || 0
      );
      configStoreApi.setState({
        selectedObject: entity,
        selectedPosition: positionVector,
        scaledSelectedPosition: positionVector.multiplyScalar(PLANETARY_SCALE),
      });
    },
    onMouseUp: (position: Vector3) => {
      configStoreApi.getState().enableOrbitControls();
      console.log(
        entity.position,
        position,
        position.clone().multiplyScalar(1 / PLANETARY_SCALE)
      );
      setPosition({
        variables: {
          pluginId: useConfigStore.getState().universeId,
          shipId: entity.id,
          position: position.clone().multiplyScalar(1 / PLANETARY_SCALE),
        },
      });
    },
  });
  return (
    <group
      {...bind()}
      ref={container}
      scale={[scale, scale, scale]}
      position={[
        (position?.x || 0) * PLANETARY_SCALE,
        (position?.y || 0) * PLANETARY_SCALE,
        (position?.z || 0) * PLANETARY_SCALE,
      ]}
      quaternion={[
        rotation?.x || 0,
        rotation?.y || 0,
        rotation?.z || 0,
        rotation?.w ?? 1,
      ]}
      onPointerOver={() => {
        if (configStoreApi.getState().viewingMode === "viewscreen") return;
        if (configStoreApi.getState().viewingMode === "core") return;
        document.body.style.cursor = "pointer";
        const positionVector = new Vector3(
          position?.x || 0,
          position?.y || 0,
          position?.z || 0
        );
        useConfigStore.setState({
          hoveredPosition: positionVector,
          scaledHoveredPosition: positionVector.multiplyScalar(PLANETARY_SCALE),
        });
      }}
      onPointerOut={() => {
        if (configStoreApi.getState().viewingMode === "viewscreen") return;
        if (configStoreApi.getState().viewingMode === "core") return;
        document.body.style.cursor = "auto";
        useConfigStore.setState({
          hoveredPosition: null,
          scaledHoveredPosition: null,
        });
      }}
    >
      {selected && <Selected />}

      <primitive
        object={scene}
        rotation={[Math.PI / 2, Math.PI, 0]}
      ></primitive>
    </group>
  );
};

export function useSetupOrbit() {
  const orbitControls = React.useRef<OrbitControls>();

  React.useEffect(() => {
    configStoreApi.setState({
      disableOrbitControls: () => {
        if (orbitControls.current) {
          orbitControls.current.enabled = false;
        }
      },
      enableOrbitControls: () => {
        if (orbitControls.current) {
          orbitControls.current.enabled = true;
        }
      },
      orbitControlsTrackPosition: (
        position: Vector3,
        distance: number = 50
      ) => {
        if (orbitControls.current) {
          orbitControls.current.target0?.copy(position);
          orbitControls.current.position0.copy(
            position
              .clone()
              // We have to add some so our distance can be properly applied
              // when the star is at 0,0,0
              .addScalar(1)
              .normalize()
              .multiplyScalar(distance)
              .add(position)
              .add(new Vector3(0, 10, 0))
          );
          orbitControls.current.reset?.();
        }
      },
    });

    // Indicate the transition is complete
    configStoreApi.getState().transitionPromise?.();
  }, []);
  return orbitControls;
}
// 1 unit = 1 million km
const Planetary: React.FC<{universeId: string; systemId: string}> = ({
  universeId,
  systemId,
}) => {
  const {camera} = useThree();

  const orbitControls = useSetupOrbit();
  const {data} = useTemplateSystemSubscription({
    variables: {id: universeId, systemId},
  });
  React.useEffect(() => {
    camera.position.set(0, 200, 500);
    camera.lookAt(new Vector3(0, 0, 0));
  }, []);

  const system = data?.pluginUniverseSystem;
  React.useEffect(() => {
    configStoreApi.setState({currentSystem: system});
    return () => {
      configStoreApi.setState({currentSystem: null});
    };
  }, [system]);

  const skyboxKey =
    data?.pluginUniverseSystem.planetarySystem?.skyboxKey || "blank";
  React.useEffect(() => {
    configStoreApi.setState({skyboxKey});
  }, [skyboxKey]);

  const {habitableZoneInner = 0, habitableZoneOuter = 3} =
    data?.pluginUniverseSystem || {};
  const hasStar = !!data?.pluginUniverseSystem.items.find(s => s.isStar);
  return (
    <>
      <OrbitControls
        ref={orbitControls}
        maxDistance={15000}
        minDistance={1}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          RIGHT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
        }}
      />
      {hasStar && data?.pluginUniverseSystem.planetarySystem && (
        <Disc
          habitableZoneInner={habitableZoneInner}
          habitableZoneOuter={habitableZoneOuter}
          scale={[PLANETARY_SCALE, PLANETARY_SCALE, PLANETARY_SCALE]}
        />
      )}
      {data?.pluginUniverseSystem.items.map(e => {
        if (e.isStar) {
          return <StarEntity key={e.id} entity={e} />;
        }
        if (e.isPlanet) {
          return <PlanetContainer key={e.id} entity={e} />;
        }
        if (e.isShip) {
          return (
            <Suspense key={e.id} fallback={null}>
              <ShipStarmapEntity entity={e} />
            </Suspense>
          );
        }
        return null;
      })}
    </>
  );
};
export default Planetary;
