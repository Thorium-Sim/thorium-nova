import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useThorium} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import useAnimationFrame from "client/src/hooks/useAnimationFrame";
import {Fragment, Suspense, useRef} from "react";
import {lightMinuteToLightYear} from "server/src/utils/unitTypes";
import {Canvas, useFrame} from "@react-three/fiber";
import {Color, Group} from "three";
import {Planet, PlanetSphere} from "client/src/components/Starmap/Planet";
import Star from "client/src/components/Starmap/Star/StarMesh";
import {Rings} from "client/src/components/Starmap/Planet/Rings";
import {Clouds} from "client/src/components/Starmap/Planet/Clouds";
import {degToRad} from "three/src/math/MathUtils";
function getDistance(
  object: {x: number; y: number; z: number},
  shipPosition: {x: number; y: number; z: number} | null,
  objectSystem: {x: number; y: number; z: number; id: number} | null,
  shipSystem: {x: number; y: number; z: number; id: number} | null
) {
  if (!shipPosition) return "Unknown";
  let distance = 0;
  // Interstellar distances OR they are in the same system
  if (objectSystem?.id === shipSystem?.id) {
    let distance = Math.hypot(
      object.x - shipPosition.x,
      object.y - shipPosition.y,
      object.z - shipPosition.z
    );
    if (objectSystem?.id) {
      // Inside a solar system
      return `${distance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} KM`;
    }
  }
  // The ship is in interstellar space, calculate the distance from the ship to the object's system.
  if (!shipSystem && objectSystem) {
    distance = Math.hypot(
      shipPosition.x - objectSystem.x,
      shipPosition.y - objectSystem.y,
      shipPosition.z - objectSystem.z
    );
  }
  // The ship is in a system and the object is in interstellar space.
  if (shipSystem && !objectSystem) {
    distance = Math.hypot(
      object.x - shipSystem.x,
      object.y - shipSystem.y,
      object.z - shipSystem.z
    );
  }
  return `${lightMinuteToLightYear(distance).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} LY`;
}

export const ObjectDetails = () => {
  const useStarmapStore = useGetStarmapStore();
  const selectedObjectIds = useStarmapStore(store => store.selectedObjectIds);

  return (
    <div className="p-2 border-2 border-white/50 bg-black/50 rounded">
      {selectedObjectIds[0] ? (
        <Suspense fallback={<h3 className="text-2xl">Accessing...</h3>}>
          <ObjectData />
        </Suspense>
      ) : (
        <h3 className="text-2xl">No Object Selected</h3>
      )}
    </div>
  );
};

const ObjectData = () => {
  const useStarmapStore = useGetStarmapStore();
  const selectedObjectIds = useStarmapStore(store => store.selectedObjectIds);

  const ship = useNetRequest("navigationShip");
  const {interpolate} = useThorium();
  const distanceRef = useRef<HTMLSpanElement>(null);
  const requestData = useNetRequest("navigationGetObject", {
    objectId: Number(selectedObjectIds[0]) || undefined,
  });
  const object = requestData.object;
  const objectSystem = requestData.objectSystem;
  const shipSystem = requestData.shipSystem;

  useAnimationFrame(() => {
    const objectPosition = object?.position;
    if (distanceRef.current && objectPosition) {
      const shipPosition = interpolate(ship.id);
      const distance = getDistance(
        objectPosition,
        shipPosition,
        objectSystem,
        shipSystem
      );
      distanceRef.current.innerText = distance;
    }
  });

  if (!object) return null;
  return (
    <Fragment>
      {object.type === "solarSystem" ? null : (
        <div className="float-left w-24 h-24 mr-2 border border-whiteAlpha-500 rounded">
          {object.type === "planet" ? (
            <PlanetCanvas
              cloudMapAsset={object.cloudMapAsset}
              textureMapAsset={object.textureMapAsset}
              ringMapAsset={object.ringMapAsset}
            />
          ) : object.type === "star" ? (
            <StarCanvas
              hue={object.hue || 30}
              isWhite={object.isWhite || false}
            />
          ) : object.type === "ship" ? (
            <img draggable="false" alt={object.name} src={object?.vanity} />
          ) : null}
        </div>
      )}
      <h3 className="text-2xl">{object.name}</h3>
      <h4 className="text-xl">{object.classification}</h4>
      <h4 className="text-xl">
        <strong>Distance:</strong> <span ref={distanceRef}></span>
      </h4>
    </Fragment>
  );
};

const PlanetGroup = ({
  cloudMapAsset,
  ringMapAsset,
  textureMapAsset,
}: {
  cloudMapAsset?: string | null;
  ringMapAsset?: string | null;
  textureMapAsset: string;
}) => {
  const planetRef = useRef<Group>(null);
  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotateY(0.002);
    }
  });
  return (
    <group ref={planetRef}>
      <group rotation={[0, 0, degToRad(12)]}>
        <PlanetSphere texture={textureMapAsset} />
        {/* The ring really does not look goood. */}
        {/* {ringMapAsset && <Rings texture={ringMapAsset} />} */}
        {cloudMapAsset && <Clouds texture={cloudMapAsset} />}
      </group>
    </group>
  );
};
const PlanetCanvas = ({
  textureMapAsset,
  ...props
}: {
  cloudMapAsset?: string | null;
  ringMapAsset?: string | null;
  textureMapAsset?: string | null;
}) => {
  if (!textureMapAsset) return null;
  return (
    <Canvas camera={{position: [0, 0, 1.8]}}>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} />
      <PlanetGroup textureMapAsset={textureMapAsset} {...props} />
    </Canvas>
  );
};

const StarCanvas = ({hue, isWhite}: {hue: number; isWhite: boolean}) => {
  const color1 = new Color(`hsl(${hue}, 100%, ${isWhite ? 100 : 50}%)`);
  const color2 = new Color(`hsl(${hue + 20}, 100%, ${isWhite ? 100 : 50}%)`);
  return (
    <Canvas camera={{position: [0, 0, 1.2]}}>
      <Star color1={color1} color2={color2} size={1} noLensFlare showSprite />
    </Canvas>
  );
};