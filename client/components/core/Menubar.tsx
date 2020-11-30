import React from "react";
import {useConfigStore} from "../starmap/configStore";
import {useShipsStore} from "../viewscreen/useSystemShips";
import {css} from "@emotion/core";
import Button from "../ui/button";
import {FaArrowLeft, FaProjectDiagram} from "react-icons/fa";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
import {MdCenterFocusWeak} from "react-icons/md";
import {CgCompressV, CgMergeHorizontal} from "react-icons/cg";
import {GiRingedPlanet, GiThreePointedShuriken} from "react-icons/gi";
import {BsFillCaretDownFill} from "react-icons/bs";
import {Vector3} from "three";
import {Tooltip} from "../ui/Tooltip";
import {useTranslation} from "react-i18next";
import Input from "../ui/Input";
import Portal from "@reach/portal";
import useOnClickOutside from "client/helpers/hooks/useClickOutside";
import SearchableList from "../ui/SearchableList";
import {useAvailableShipsQuery} from "client/generated/graphql";

const SpawnMenu: React.FC = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  useOnClickOutside(menuRef, () => {
    setMenuOpen(false);
  });
  const {t} = useTranslation();
  const [dimensions, setDimensions] = React.useState<DOMRect>();
  const {data} = useAvailableShipsQuery();

  const selectedSpawn = useConfigStore(store => store.shipSpawnTemplateId);
  const selectedShip = data?.flight?.availableShips.find(
    s => s.id === selectedSpawn
  );
  const [categoryType, setCategoryType] = React.useState<
    "category" | "faction"
  >("category");
  return (
    <>
      <Button
        size="xs"
        variant="outline"
        variantColor="alert"
        ref={buttonRef}
        onClick={() => {
          setMenuOpen(s => !s);
          buttonRef.current &&
            setDimensions(buttonRef.current.getBoundingClientRect());
        }}
      >
        <Tooltip label={t("Configure spawnable item")}>
          <span className="flex items-center">
            {selectedShip
              ? selectedShip.identity.name
              : t("Configure Spawn...")}{" "}
            <BsFillCaretDownFill size="11" />
          </span>
        </Tooltip>
      </Button>
      {dimensions && menuOpen && (
        <Portal>
          <div
            className="fixed top-0 left-0 border border-alert-200 bg-opacity-25 bg-alert-800 rounded-sm w-64 z-40"
            css={css`
              height: 30rem;
              transform: translate(
                ${dimensions.left}px,
                ${dimensions.bottom + 2}px
              );
            `}
          >
            <div className="flex justify-center gap-4">
              <Button size="xs" onClick={() => setCategoryType("category")}>
                Class
              </Button>
              <Button
                size="xs"
                onClick={() => setCategoryType("faction")}
                variantColor="warning"
              >
                Faction
              </Button>
            </div>
            <SearchableList
              items={
                data?.flight?.availableShips.map(s => ({
                  id: s.id,
                  label: s.identity.name,
                  category:
                    categoryType === "faction"
                      ? s.factionAssignment?.faction?.identity.name || ""
                      : s.isShip?.category,
                })) || []
              }
              selectedItem={selectedSpawn}
              setSelectedItem={id => {
                setMenuOpen(false);
                useConfigStore.setState({shipSpawnTemplateId: id});
              }}
            />
          </div>
        </Portal>
      )}
    </>
  );
};
export const StarmapCoreMenubar: React.FC<{
  canvasHeight: number;
  canvasWidth: number;
}> = ({canvasHeight, canvasWidth}) => {
  const systemId = useConfigStore(store => store.systemId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const autopilotData = useConfigStore(store => store.includeAutopilotData);
  const compressYDimension = useConfigStore(store => store.compressYDimension);
  const hidePlanets = useConfigStore(store => store.hidePlanets);
  const yDimensionIndex = useConfigStore(store => store.yDimensionIndex);
  const instantMoveObjects = useConfigStore(store => store.instantMoveObjects);
  const {selectedIds} = useSelectedShips();
  const {t} = useTranslation();
  const yInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      className="absolute top-0 left-0 w-screen p-2 pointer-events-none"
      css={css`
        * {
          pointer-events: all;
        }
      `}
    >
      <div className="flex gap-2 pointer-events-none">
        {systemId && (
          <Button
            variant="ghost"
            variantColor="info"
            size="sm"
            onClick={() => setSystemId("")}
          >
            <FaArrowLeft />
          </Button>
        )}
        <Tooltip label={t("Focus On Selected Objects")}>
          <Button
            variant="ghost"
            variantColor="info"
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={() => {
              const ships = useShipsStore.getState();
              const selectedShips = selectedIds.map(id => ships[id]);
              const [center, min, max] = selectedShips.reduce(
                (prev, next, index, arr) => {
                  if (!next.position) return prev;
                  prev[0].x += next.position.x / arr.length;
                  prev[0].z += next.position.z / arr.length;

                  // min
                  prev[1].x =
                    prev[1].x > next.position.x ? next.position.x : prev[1].x;
                  prev[1].z =
                    prev[1].z > next.position.z ? next.position.z : prev[1].z;

                  // max
                  prev[2].x =
                    prev[2].x < next.position.x ? next.position.x : prev[2].x;
                  prev[2].z =
                    prev[2].z < next.position.z ? next.position.z : prev[2].z;
                  return prev;
                },
                [
                  new Vector3(),
                  new Vector3(Infinity, Infinity, Infinity),
                  new Vector3(-Infinity, -Infinity, -Infinity),
                ]
              );

              const xDiff = 1 + Math.abs(max.x - min.x);
              const zDiff = 1 + Math.abs(max.z - min.z);
              const diff = xDiff > zDiff ? xDiff : zDiff;
              const fov = 45 * (Math.PI / 180);
              const zoom = (diff / 2 / (fov / 2)) * 1.25;

              useConfigStore.getState().orbitControlsSet({
                position: center,
                zoom,
              });
            }}
          >
            <MdCenterFocusWeak />
          </Button>
        </Tooltip>
        <Tooltip label={t("Show Autopilot Destinations")}>
          <Button
            variant={autopilotData ? "solid" : "ghost"}
            variantColor="info"
            size="sm"
            onClick={() => {
              useConfigStore.setState({includeAutopilotData: !autopilotData});
            }}
          >
            <FaProjectDiagram />
          </Button>
        </Tooltip>
        <Tooltip label={t("Compress Y Dimension")}>
          <Button
            size="sm"
            variant={compressYDimension ? "solid" : "ghost"}
            onClick={() => {
              useConfigStore.setState({
                compressYDimension: !compressYDimension,
              });
            }}
            variantColor="primary"
          >
            <CgCompressV />
          </Button>
        </Tooltip>
        <Tooltip label={t("Hide Planets")}>
          <Button
            size="sm"
            variant={hidePlanets ? "solid" : "ghost"}
            onClick={() => {
              useConfigStore.setState({hidePlanets: !hidePlanets});
            }}
            variantColor="primary"
          >
            <GiRingedPlanet />
          </Button>
        </Tooltip>
        <Tooltip label={t("Y Dimension Index")}>
          <div className="w-32">
            <Input
              inputSize="sm"
              label="Y Dimension Index"
              labelHidden
              ref={yInputRef}
              defaultValue={yDimensionIndex.toString()}
              type="search"
              onChange={e =>
                useConfigStore.setState({yDimensionIndex: parseFloat(e) || 0})
              }
              onBlur={(e: any) => (e.target.value = yDimensionIndex.toString())}
            />
          </div>
        </Tooltip>
        <Tooltip label={t("Set Y Dimension Index to Selected Position")}>
          <Button
            size="sm"
            onClick={() => {
              const ships = useShipsStore.getState();
              const selectedShips = selectedIds.map(id => ships[id]);
              const center =
                Math.round(
                  selectedShips.reduce((prev, next, index, arr) => {
                    prev += (next.position?.y || 0) / arr.length;
                    return prev;
                  }, 0) * 100
                ) / 100;
              useConfigStore.setState({yDimensionIndex: center});
              if (yInputRef.current) {
                yInputRef.current.value = center.toString();
              }
            }}
            disabled={selectedIds.length === 0}
            variantColor="primary"
          >
            <CgMergeHorizontal />
          </Button>
        </Tooltip>
        <Tooltip label={t("Instantly Move Objects")}>
          <Button
            size="sm"
            variant={instantMoveObjects ? "solid" : "ghost"}
            onClick={() => {
              useConfigStore.setState({
                instantMoveObjects: !instantMoveObjects,
              });
            }}
            variantColor="danger"
          >
            <GiThreePointedShuriken />
          </Button>
        </Tooltip>
        <SpawnMenu />
      </div>
    </div>
  );
};
