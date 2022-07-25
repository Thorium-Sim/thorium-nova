import * as React from "react";
import {Suspense} from "react";
import {useThree} from "@react-three/fiber";
import {useEffect} from "react";
import {CameraControls, useExternalCameraControl} from "./CameraControls";
import {useGetStarmapStore} from "./starmapStore";
import CameraControlsClass from "camera-controls";
import {
  astronomicalUnitToKilometer,
  Kilometer,
} from "server/src/utils/unitTypes";
import {Box3, Camera, Vector3} from "three";
import Button from "../ui/Button";
import {Menu, Transition, Disclosure} from "@headlessui/react";
import {HiChevronDown} from "react-icons/hi";
import {starTypes} from "server/src/spawners/starTypes";
import {netSend} from "client/src/context/netSend";
import {useConfirm} from "@thorium/ui/AlertDialog";
import {planetTypes} from "server/src/spawners/planetTypes";
import {useNetRequest} from "client/src/context/useNetRequest";
import Disc from "./Disc";
import {HiChevronUp} from "react-icons/hi";
import {useLocalStorage} from "client/src/hooks/useLocalStorage";
import {BasicDisclosure} from "./EditorPalettes/BasicDisclosure";
import {PlanetDisclosure} from "./EditorPalettes/PlanetDisclosure";
import {OrbitDisclosure} from "./EditorPalettes/OrbitDisclosure";
import {PlanetAssetDisclosure} from "././EditorPalettes/PlanetAssetDisclosure";
import StarPlugin from "server/src/classes/Plugins/Universe/Star";
import {PolarGrid} from "./PolarGrid";
import {useSystemIds} from "./useSystemIds";
import Input from "@thorium/ui/Input";
import Checkbox from "@thorium/ui/Checkbox";
import {useParams} from "react-router-dom";
const ACTION = CameraControlsClass.ACTION;

// 10% further than Neptune's orbit
export const SOLAR_SYSTEM_MAX_DISTANCE: Kilometer = 4_000_000_000 * 1.1;

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

export function SolarSystemMap({
  skyboxKey = "Basic",
  children,
}: {
  skyboxKey: string;
  children?: React.ReactNode;
}) {
  const pluginId = useParams().pluginId;
  const useStarmapStore = useGetStarmapStore();

  const {camera} = useThree();
  const controlsEnabled = useStarmapStore(s => s.cameraControlsEnabled);
  const cameraView = useStarmapStore(s => s.cameraView);
  const orbitControls = React.useRef<CameraControlsClass>(null);

  useEffect(() => {
    useStarmapStore.setState({skyboxKey: skyboxKey || "blank"});
  }, [skyboxKey]);

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

  useExternalCameraControl(orbitControls);

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
      {!pluginId ? null : <HabitableZone />}
      <PolarGrid
        rotation={[0, (2 * Math.PI) / 12, 0]}
        args={[SOLAR_SYSTEM_MAX_DISTANCE, 12, 20, 64, 0xffffff, 0xffffff]}
      />
      {children}
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
  const useStarmapStore = useGetStarmapStore();

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

    if (typeof selectedObjectId === "string") {
      await netSend("pluginStarDelete", {
        pluginId,
        solarSystemId,
        starId: selectedObjectId,
      });
    } else {
      // TODO: Delete objects from the flight director menubar? Maybe not...
    }

    useStarmapStore.setState({
      selectedObjectId: null,
    });
  }

  return (
    <>
      <Button
        className="btn-info btn-outline btn-xs"
        onClick={() =>
          useStarmapStore.setState({selectedObjectId: solarSystemId})
        }
      >
        Edit System
      </Button>
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

function AddStarMenu() {
  const [pluginId, solarSystemId] = useSystemIds();
  const useStarmapStore = useGetStarmapStore();

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
  const useStarmapStore = useGetStarmapStore();

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

const HandleIsOpen = ({
  open,
  title,
  scrollRef,
}: {
  title: string;
  open: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}) => {
  const hasMounted = React.useRef(false);
  useEffect(() => {
    localStorage.setItem(`editor-palette-open-${title}`, JSON.stringify(open));
  }, [title, open]);
  React.useLayoutEffect(() => {
    if (open && hasMounted.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
      }, 100);
    }
    hasMounted.current = true;
  }, [open, scrollRef]);

  return null;
};
export function PaletteDisclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isDefaultOpen] = useLocalStorage(
    `editor-palette-open-${title}`,
    defaultOpen
  );
  const disclosureRef = React.useRef<HTMLDivElement>(null);
  return (
    <Disclosure defaultOpen={isDefaultOpen}>
      {({open}) => (
        <>
          <HandleIsOpen open={open} title={title} scrollRef={disclosureRef} />
          <div
            className="w-full py-1 px-2 bg-gray-900 sticky -top-1"
            ref={disclosureRef}
          >
            <Disclosure.Button className="btn btn-notice btn-sm justify-between btn-block">
              <span>{title}</span>
              <HiChevronUp
                className={` transition-transform${
                  open ? "transform rotate-180" : ""
                } w-5 h-5`}
              />
            </Disclosure.Button>
          </div>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="pt-4 pb-2 px-2 border-b border-b-gray-700">
              {children}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}

function useSelectedObject() {
  const useStarmapStore = useGetStarmapStore();

  const [pluginId, solarSystemId] = useSystemIds();
  const selectedObjectId = useStarmapStore(state => state.selectedObjectId);
  const systemData = useNetRequest("pluginSolarSystem", {
    pluginId,
    solarSystemId,
  });

  // It could be a system, star, or planet
  if (solarSystemId === selectedObjectId) {
    return {type: "system" as const, object: systemData};
  }

  const star = systemData.stars.find(star => star.name === selectedObjectId);
  if (star) {
    return {type: "star" as const, object: star};
  }

  const planet = systemData.planets.find(
    planet => planet.name === selectedObjectId
  );
  if (planet) {
    return {type: "planet" as const, object: planet};
  }

  return null;
}
export function SolarSystemPalette() {
  const results = useSelectedObject();
  if (!results) return null;
  return (
    <div
      className="w-full h-full overflow-y-auto overflow-x-hidden text-white"
      key={results.object.name}
    >
      <BasicDisclosure object={results.object} type={results.type} />
      {results.type === "planet" && (
        <>
          <PlanetDisclosure object={results.object} />
          <PlanetAssetDisclosure object={results.object} />
          <OrbitDisclosure object={results.object} />
        </>
      )}
      {results.type === "star" && <StarDisclosure object={results.object} />}
    </div>
  );
}

function StarDisclosure({object}: {object: StarPlugin}) {
  const [pluginId, solarSystemId] = useSystemIds();

  return (
    <PaletteDisclosure title="Star">
      <Input
        label="Spectral Type"
        helperText="Cannot be changed"
        type="text"
        readOnly
        defaultValue={object.spectralType}
      />
      <Input
        label="Solar Mass"
        helperText="The mass of the star compared to the Sun"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.solarMass}
        onChange={e => {
          netSend("pluginStarUpdate", {
            pluginId,
            solarSystemId,
            starId: object.name,
            solarMass: parseFloat(e.target.value),
          });
        }}
      />
      <Input
        label="Age"
        helperText="The age of the star in years"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.age}
        onChange={e => {
          netSend("pluginStarUpdate", {
            pluginId,
            solarSystemId,
            starId: object.name,
            age: parseFloat(e.target.value),
          });
        }}
      />
      <Input
        label="Radius"
        helperText="The radius of the star compared to the radius of the sun."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.radius}
        onChange={e => {
          netSend("pluginStarUpdate", {
            pluginId,
            solarSystemId,
            starId: object.name,
            radius: parseFloat(e.target.value),
          });
        }}
      />
      <Input
        label="Temperature"
        helperText="The temperature of the star in Kelvin."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.temperature}
        onChange={e => {
          netSend("pluginStarUpdate", {
            pluginId,
            solarSystemId,
            starId: object.name,
            temperature: parseFloat(e.target.value),
          });
        }}
      />
      <Input
        label="Hue"
        helperText="The hue of the star"
        type="range"
        min={0}
        max={360}
        step={1}
        defaultValue={object.hue}
        onChange={e => {
          netSend("pluginStarUpdate", {
            pluginId,
            solarSystemId,
            starId: object.name,
            hue: parseFloat(e.target.value),
          });
        }}
      />
      <Checkbox
        label="White Star"
        helperText="If checked, the star will be white. Overrides hue."
        defaultChecked={object.isWhite}
        onChange={e => {
          netSend("pluginStarUpdate", {
            pluginId,
            solarSystemId,
            starId: object.name,
            isWhite: e.target.checked,
          });
        }}
      />
    </PaletteDisclosure>
  );
}
