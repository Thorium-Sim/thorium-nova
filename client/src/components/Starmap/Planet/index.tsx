import {Suspense, useRef} from "react";
import {useTexture} from "@react-three/drei";
import PlanetPlugin from "server/src/classes/Plugins/Universe/Planet";
import {Rings} from "./Rings";
import {Clouds} from "./Clouds";
import Selected from "../Selected";
import Dot from "./Dot.svg";
import {useGetStarmapStore} from "../starmapStore";
import SystemLabel from "../SystemMarker/SystemLabel";
import {DEG2RAD} from "three/src/math/MathUtils";
import {Group, Vector3} from "three";
import {useFrame} from "@react-three/fiber";
import {getOrbitPosition} from "server/src/utils/getOrbitPosition";
import {Kilometer} from "server/src/utils/unitTypes";
import {OrbitLine} from "../OrbitContainer";
import type {
  IdentityComponent,
  IsPlanetComponent,
  SatelliteComponent,
} from "server/src/components/list";

const PlanetSprite = ({color = "white"}) => {
  const spriteMap = useTexture(Dot);

  return (
    <sprite>
      <spriteMaterial
        attach="material"
        map={spriteMap}
        color={color}
        sizeAttenuation={false}
      ></spriteMaterial>
    </sprite>
  );
};
function PlanetSphere({
  texture,
  wireframe,
}: {
  texture: string;
  wireframe?: boolean;
}) {
  const mapTexture = useTexture(texture);

  return (
    <group>
      <mesh castShadow>
        <sphereBufferGeometry args={[1, 32, 32]} attach="geometry" />
        <meshPhysicalMaterial
          map={wireframe ? undefined : mapTexture}
          wireframe={wireframe}
          transparent
          attach="material"
        />
      </mesh>
    </group>
  );
}

const SPRITE_SCALE_FACTOR = 50;
const spriteScale = 1 / SPRITE_SCALE_FACTOR;
const distanceVector = new Vector3();

export function Planet({
  planet,
  isSatellite,
  showSprite,
  showMesh = true,
}: {
  planet: {
    id: string | number;
    name: string;
    isPlanet: {
      radius: number;
      ringMapAsset: string | null;
      cloudMapAsset: string | null;
      textureMapAsset: string;
    };
    satellite: {
      axialTilt: number;
      semiMajorAxis: number;
      eccentricity: number;
      orbitalArc: number;
      inclination: number;
      showOrbit: boolean;
    };
  };
  isSatellite?: boolean;
  origin?: Vector3;
  showSprite?: boolean;
  showMesh?: boolean;
}) {
  const useStarmapStore = useGetStarmapStore();

  const selected = useStarmapStore(
    state => state.selectedObjectId === planet.id
  );
  const {
    radius,
    ringMapAsset: rings,
    cloudMapAsset: clouds,
    textureMapAsset: texture,
  } = planet.isPlanet;
  const {axialTilt, inclination, semiMajorAxis, eccentricity} =
    planet.satellite;
  const viewingMode = useStarmapStore(state => state.viewingMode);

  const position = getOrbitPosition(planet.satellite);

  // TODO - April 7, 2022 - Figure out how to make the scales nice for solar system editing
  const size =
    viewingMode !== "editor"
      ? radius
      : (((isSatellite ? 1 : 5) + 100 * radius * 10) as Kilometer);

  // TODO - April 7, 2022 - Add moons
  const satellites: PlanetPlugin[] = [];

  const wireframe = false;

  const labelRef = useRef<Group>(null);
  const planetSpriteRef = useRef<Group>();
  const planetMeshRef = useRef<Group>();

  useFrame(({camera}) => {
    if (labelRef.current) {
      const zoom = camera.position.distanceTo(position) + 500;
      let zoomedScale = (zoom / 2) * 0.01;
      labelRef.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
      labelRef.current.quaternion.copy(camera.quaternion);
    }

    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );

    if (planetSpriteRef.current && planetMeshRef.current) {
      if (
        size &&
        distance / size > 100 &&
        (viewingMode === "core" || showSprite)
      ) {
        planetSpriteRef.current.visible = true;
        planetMeshRef.current.visible = false;
      } else if (showMesh) {
        planetSpriteRef.current.visible = false;
        planetMeshRef.current.visible = true;
      }
    }
  });

  function onPointerOver() {
    if (viewingMode === "viewscreen") return;
    if (viewingMode === "core") return;
    // const hoveredPosition = getOrbitPosition({
    //   eccentricity,
    //   orbitalArc,
    //   orbitalInclination,
    //   radius: orbitRadius,
    //   origin,
    // });
    // useConfigStore.setState({
    //   hoveredPosition,
    //   scaledHoveredPosition: getOrbitPosition({
    //     eccentricity,
    //     orbitalArc,
    //     orbitalInclination,
    //     radius: orbitRadius * PLANETARY_SCALE * (isSatellite ? 100 : 1),
    //     origin: scaledOrigin,
    //   }),
    // });
    document.body.style.cursor = "pointer";
  }
  function onPointerOut() {
    // if (viewingMode === "viewscreen") return;
    // if (viewingMode === "core") return;
    // useConfigStore.setState({
    //   hoveredPosition: null,
    //   scaledHoveredPosition: null,
    // });
    document.body.style.cursor = "auto";
  }
  function onClick() {
    if (viewingMode === "viewscreen") return;
    if (viewingMode === "core") return;
    useStarmapStore.setState({
      selectedObjectId: planet.id,
    });
  }

  const radiusY = semiMajorAxis - semiMajorAxis * eccentricity;

  return (
    <group>
      {viewingMode !== "viewscreen" && planet.satellite.showOrbit && (
        <group rotation={[0, 0, inclination * DEG2RAD]}>
          <OrbitLine radiusX={semiMajorAxis} radiusY={radiusY} />
        </group>
      )}
      <group position={position}>
        <group
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={onClick}
        >
          <Suspense fallback={null}>
            <group
              ref={planetSpriteRef}
              scale={[spriteScale, spriteScale, spriteScale]}
            >
              <PlanetSprite />
            </group>
            <group
              ref={planetMeshRef}
              scale={[size, size, size]}
              rotation={[0, 0, axialTilt * DEG2RAD]}
            >
              <PlanetSphere texture={texture} wireframe={wireframe} />
              {rings && <Rings texture={rings} wireframe={wireframe} />}
              {clouds && !wireframe && <Clouds texture={clouds} />}
              {selected && <Selected />}
            </group>
          </Suspense>
        </group>
        {viewingMode !== "viewscreen" && !isSatellite && (
          <group ref={labelRef}>
            <SystemLabel
              systemId=""
              name={planet.name}
              hoveringDirection={{current: 0}}
              scale={5 / 128}
            />
          </group>
        )}
        {/* TODO June 20, 2022 - Figure out all of the stuff around moons */}
        {/* {satellites?.map((s, i) => (
          <Planet
            key={`orbit-${s.name}`}
            isSatellite
            origin={position}
            planet={s}
          />
        ))} */}
      </group>
    </group>
  );
}
