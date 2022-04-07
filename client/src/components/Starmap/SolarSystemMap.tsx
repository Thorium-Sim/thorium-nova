import * as React from "react";
import {Suspense} from "react";
import {useThree} from "@react-three/fiber";
import {useEffect} from "react";
import {CameraControls} from "./CameraControls";
import {useStarmapStore} from "./starmapStore";
import CameraControlsClass from "camera-controls";
import {
  astronomicalUnitToKilometer,
  Kilometer,
} from "server/src/utils/unitTypes";
import {Box3, Camera, Vector3} from "three";
import {useParams} from "react-router";
import Button from "../ui/Button";
import {Menu, Transition} from "@headlessui/react";
import {HiChevronDown} from "react-icons/hi";
import {starTypes} from "server/src/spawners/starTypes";
import {netSend} from "client/src/context/netSend";
import {useConfirm} from "@thorium/ui/AlertDialog";
import {planetTypes} from "server/src/spawners/planetTypes";
import {useMatch} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import Disc from "./Disc";
import StarEntity from "./Star";
import {Planet} from "./Planet";

const ACTION = CameraControlsClass.ACTION;

// 10% further than Neptune's orbit
const SOLAR_SYSTEM_MAX_DISTANCE: Kilometer = 4_000_000_000 * 1.1;

function HabitableZone() {
  const [pluginId, solarSystemId] = useSystemIds();
  const {
    habitableZoneInner = 0,
    habitableZoneOuter = 3,
    stars,
  } = useNetRequest("pluginSolarSystem", {
    pluginId,
    solarSystemId,
  });
  const scaleUnit = astronomicalUnitToKilometer(1);
  return stars.length > 0 ? (
    <Disc
      habitableZoneInner={habitableZoneInner}
      habitableZoneOuter={habitableZoneOuter}
      scale={[scaleUnit, scaleUnit, scaleUnit]}
    />
  ) : null;
}

export function SolarSystemMap() {
  const {camera} = useThree();
  const controlsEnabled = useStarmapStore(s => s.cameraControlsEnabled);
  const cameraView = useStarmapStore(s => s.cameraView);
  const orbitControls = React.useRef<CameraControlsClass>(null);

  const [pluginId, solarSystemId] = useSystemIds();
  const systemData = useNetRequest("pluginSolarSystem", {
    pluginId,
    solarSystemId,
  });

  useEffect(() => {
    // Set the initial camera position
    orbitControls.current?.setPosition(0, SOLAR_SYSTEM_MAX_DISTANCE / 2, 0);
    const max = SOLAR_SYSTEM_MAX_DISTANCE * 0.75;
    orbitControls.current?.setBoundary(
      new Box3(new Vector3(-max, -max, -max), new Vector3(max, max, max))
    );
    useStarmapStore.getState().setCameraControlsEnabled(true);
  }, [camera]);

  useEffect(() => {
    if (cameraView === "2d") {
      orbitControls.current?.rotatePolarTo(0, true);
      orbitControls.current?.rotateAzimuthTo(0, true);
    }
  }, [camera, cameraView]);
  console.log(systemData.planets);
  return (
    <Suspense fallback={null}>
      <CameraControls
        ref={orbitControls}
        enabled={controlsEnabled}
        maxDistance={SOLAR_SYSTEM_MAX_DISTANCE}
        minDistance={1}
        mouseButtons={{
          left: cameraView === "2d" ? ACTION.TRUCK : ACTION.ROTATE,
          right: ACTION.TRUCK,
          middle: ACTION.DOLLY,
          wheel: ACTION.DOLLY,
          shiftLeft: ACTION.DOLLY,
        }}
        dollyToCursor
        dollySpeed={0.5}
      />
      <HabitableZone />
      {systemData.stars.map(star => (
        <StarEntity key={star.name} star={star} />
      ))}
      {systemData.planets.map(planet => (
        <Planet key={planet.name} planet={planet} />
      ))}
      <polarGridHelper
        rotation={[0, (2 * Math.PI) / 12, 0]}
        args={[SOLAR_SYSTEM_MAX_DISTANCE, 12, 20, 64, 0x050505, 0x050505]}
      />
    </Suspense>
  );
}

interface SceneRef {
  camera: () => Camera;
}

export function SolarSystemMenuButtons({
  sceneRef,
}: {
  sceneRef: React.MutableRefObject<SceneRef | undefined>;
}) {
  const [pluginId, solarSystemId] = useSystemIds();

  const selectedObjectId = useStarmapStore(s => s.selectedObjectId);
  const cameraView = useStarmapStore(s => s.cameraView);
  const confirm = useConfirm();

  async function deleteObject() {
    const selectedObjectId = useStarmapStore.getState().selectedObjectId;
    if (!selectedObjectId) return;

    const doRemove = await confirm({
      header: "Are you sure you want to remove this object?",
      body: "It will remove all of the objects inside of it.",
    });
    if (!doRemove) return;

    await netSend("pluginStarDelete", {
      pluginId,
      solarSystemId,
      starId: selectedObjectId,
    });

    useStarmapStore.setState({
      selectedObjectId: null,
    });
  }

  return (
    <>
      <AddStarMenu />
      <AddPlanetMenu />
      <Button
        className="btn-error btn-outline btn-xs"
        disabled={!selectedObjectId}
        onClick={deleteObject}
      >
        Delete
      </Button>
      <Button
        className="btn-notice btn-outline btn-xs"
        onClick={() =>
          useStarmapStore
            .getState()
            .setCameraView(cameraView === "2d" ? "3d" : "2d")
        }
      >
        Go to {cameraView === "2d" ? "3D" : "2D"}
      </Button>
    </>
  );
}

function useSystemIds() {
  const pluginId = useParams().pluginId;
  const match = useMatch("/config/:pluginId/starmap/:systemId");
  const matchSystemId = match?.params.systemId;
  if (!pluginId) throw new Error("Error determining plugin ID");
  if (!matchSystemId) throw new Error("Error determining solar system ID");
  return [pluginId, matchSystemId] as const;
}

function AddStarMenu() {
  const [pluginId, solarSystemId] = useSystemIds();
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="btn btn-error btn-outline btn-xs">
          Add Star
          <HiChevronDown className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          static
          className="z-30 absolute left-0 w-56 mt-2 origin-top-right bg-gray-900 divide-y divide-gray-800 rounded-md shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none"
        >
          {starTypes.map(starType => (
            <Menu.Item key={starType.spectralType}>
              {({active}) => (
                <button
                  className={`${
                    active ? "bg-violet-900 text-white" : "text-gray-200"
                  } group flex items-center w-full px-2 py-2 text-sm`}
                  onClick={async () => {
                    const result = await netSend("pluginStarCreate", {
                      pluginId,
                      solarSystemId,
                      spectralType: starType.spectralType,
                    });
                    useStarmapStore.setState({selectedObjectId: result.name});
                  }}
                >
                  {starType.spectralType} - {starType.name} (
                  {Math.round(starType.prevalence * 1000) / 10}% Common)
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function AddPlanetMenu() {
  const [pluginId, solarSystemId] = useSystemIds();
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="btn btn-primary btn-outline btn-xs">
          Add Planet
          <HiChevronDown className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          static
          className="z-30 absolute left-0 w-56 mt-2 origin-top-right bg-gray-900 divide-y divide-gray-800 rounded-md shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none"
        >
          {planetTypes.map(planetType => (
            <Menu.Item key={planetType.classification}>
              {({active}) => (
                <button
                  className={`${
                    active ? "bg-violet-900 text-white" : "text-gray-200"
                  } group flex items-center w-full px-2 py-2 text-sm`}
                  onClick={async () => {
                    const result = await netSend("pluginPlanetCreate", {
                      pluginId,
                      solarSystemId,
                      planetType: planetType.classification,
                    });
                    useStarmapStore.setState({selectedObjectId: result.name});
                  }}
                >
                  {planetType.classification} - {planetType.name}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
