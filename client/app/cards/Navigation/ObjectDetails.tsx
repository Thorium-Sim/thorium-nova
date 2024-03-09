import {useGetStarmapStore} from "@client/components/Starmap/starmapStore";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import {Suspense, useRef} from "react";
import {Canvas, useFrame} from "@react-three/fiber";
import {Color, Group} from "three";
import {PlanetSphere} from "@client/components/Starmap/Planet";
import Star from "@client/components/Starmap/Star/StarMesh";
import {Clouds} from "@client/components/Starmap/Planet/Clouds";
import {useLiveQuery} from "@thorium/live-query/client";
import {q} from "@client/context/AppContext";
import {getNavigationDistance} from "@server/utils/getNavigationDistance";

function getDistanceLabel(input: {distance: number; unit: string} | null) {
  if (!input) return "Unknown";
  return `${input.distance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${input.unit}`;
}

export const ObjectDetails = () => {
  const useStarmapStore = useGetStarmapStore();
  const selectedObjectIds = useStarmapStore(store => store.selectedObjectIds);

  return (
    <div className="p-2 border border-white/50 bg-black/50 rounded">
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

  const [ship] = q.navigation.ship.useNetRequest();
  const {interpolate} = useLiveQuery();
  const distanceRef = useRef<HTMLSpanElement>(null);
  const [requestData] = q.navigation.object.useNetRequest({
    objectId: Number(selectedObjectIds[0]) || undefined,
  });
  const object = requestData.object;
  const objectSystem = requestData.objectSystem;
  const shipSystem = requestData.shipSystem;

  useAnimationFrame(() => {
    const objectPosition = object?.position;
    if (distanceRef.current && objectPosition) {
      const shipPosition = interpolate(ship.id);
      const distance = getNavigationDistance(
        objectPosition,
        shipPosition,
        objectSystem,
        shipSystem
      );
      distanceRef.current.innerText = getDistanceLabel(distance);
    }
  });

  if (!object) return null;
  return (
    <div className="flex items-center">
      {object.type === "solarSystem" ? null : (
        <div className="w-24 h-24 mr-2 border border-white/50 rounded">
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
      <div>
        <h3 className="text-2xl">{object.name}</h3>
        <h4 className="text-xl">{object.classification}</h4>
        <h4 className="text-xl">
          <strong>Distance:</strong> <span ref={distanceRef}></span>
        </h4>
      </div>
    </div>
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
      <PlanetSphere texture={textureMapAsset} />
      {/* The ring really does not look goood. */}
      {/* {ringMapAsset && <Rings texture={ringMapAsset} />} */}
      {cloudMapAsset && <Clouds texture={cloudMapAsset} />}
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
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0.5, 1.5]} intensity={1} />
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
