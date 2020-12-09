import React from "react";
import {
  Box,
  Collapse,
  Menu,
  MenuButton as MenuButtonComp,
  MenuButtonProps,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
} from "@chakra-ui/core";
import {FaArrowLeft, FaChevronDown, FaHome} from "react-icons/fa";
import {useTranslation} from "react-i18next";
import {Camera, Vector3} from "three";
import {
  useUniverseAddSystemMutation,
  useUniverseObjectRemoveMutation,
  useUniverseAddStarMutation,
  useUniverseAddPlanetMutation,
  useUniverseAddMoonMutation,
  useStarTypesQuery,
  usePlanetTypesQuery,
  usePluginShipsSubscription,
  useUniverseAddStarbaseMutation,
} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "./configStore";
import Button from "../ui/button";

import {useConfirm} from "../Dialog";
import {useHotkeys} from "react-hotkeys-hook";
import {Link} from "react-router-dom";
import {isPlanet} from "./ConfigPalette/utils";
import StarSearch from "./StarSearch";
import {css} from "@emotion/core";
import useOnClickOutside from "client/helpers/hooks/useClickOutside";
import {Tooltip} from "../ui/Tooltip";
import Portal from "@reach/portal";
import SearchableList from "../ui/SearchableList";
import {PLANETARY_SCALE} from "./constants";

const MenuButton = MenuButtonComp as React.FC<
  MenuButtonProps & {variantColor: string}
>;
interface SceneRef {
  camera: () => Camera;
}

const Menubar: React.FC<{
  sceneRef: React.MutableRefObject<SceneRef | undefined>;
}> = ({sceneRef}) => {
  const [addSystem] = useUniverseAddSystemMutation();
  const [removeObject] = useUniverseObjectRemoveMutation();
  const [addStar] = useUniverseAddStarMutation();
  const [addPlanet] = useUniverseAddPlanetMutation();
  const [addMoon] = useUniverseAddMoonMutation();

  const {data: starTypesData} = useStarTypesQuery();
  const {data: planetTypesData} = usePlanetTypesQuery();

  const {t} = useTranslation();

  function getObjectType(object: any) {
    if (object.planetarySystem) return t("planetary system");
    if (object.isStar) return t("star");
    if (object.isPlanet) return t("planet");
    return t("object");
  }

  const confirm = useConfirm();
  const [showingAddOptions, setShowingAddOptions] = React.useState(false);

  const universeId = useConfigStore(store => store.universeId);
  const systemId = useConfigStore(store => store.systemId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const selectedObject = useConfigStore(store => store.selectedObject);
  const measuring = useConfigStore(store => store.measuring);

  useHotkeys("n", () => {
    if (systemId) return;
    const camera = sceneRef.current?.camera();
    if (!camera) return;
    const vec = new Vector3(0, 0, -100);
    vec.applyQuaternion(camera.quaternion).add(camera.position);
    addSystem({
      variables: {id: useConfigStore.getState().universeId, position: vec},
    }).then(res => {
      if (res.data?.pluginUniverseAddSystem)
        configStoreApi.setState({
          selectedObject: res.data.pluginUniverseAddSystem,
        });
    });
  });

  async function deleteObject() {
    const selectedObject = configStoreApi.getState().selectedObject;
    if (!selectedObject) return;

    const doRemove = await confirm({
      header: t("Are you sure you want to remove this {{object}}?", {
        object: getObjectType(selectedObject),
      }),
      body: t("It will remove all of the objects inside of it."),
    });
    if (!doRemove) return;

    removeObject({
      variables: {
        id: useConfigStore.getState().universeId,
        objectId: selectedObject.id,
      },
    });

    configStoreApi.setState({
      selectedObject: null,
      selectedPosition: null,
      scaledSelectedPosition: null,
    });
  }
  useHotkeys("backspace", () => {
    deleteObject();
  });

  React.useEffect(() => {
    if (!systemId && showingAddOptions) {
      setShowingAddOptions(false);
    }
  }, [systemId, showingAddOptions]);
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      padding={2}
      css={css`
        pointer-events: none;
        * {
          pointer-events: all;
        }
      `}
    >
      <Stack
        isInline
        spacing={2}
        css={css`
          pointer-events: none;
          * {
            pointer-events: all;
          }
        `}
      >
        <Button as={Link} to="/" variantColor="info" variant="ghost" size="sm">
          <FaHome />
        </Button>
        {systemId ? (
          <Button
            variant="ghost"
            variantColor="info"
            size="sm"
            onClick={() => setSystemId("")}
          >
            <FaArrowLeft />
          </Button>
        ) : (
          <Button
            as={Link}
            to={`/config/${universeId}/edit`}
            variantColor="info"
            variant="ghost"
            size="sm"
          >
            <FaArrowLeft />
          </Button>
        )}
        <Button
          variantColor="success"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (systemId) {
              setShowingAddOptions(a => !a);
              return;
            }
            const camera = sceneRef.current?.camera();
            if (!camera) return;
            const vec = new Vector3(0, 0, -30);
            vec.applyQuaternion(camera.quaternion);
            addSystem({variables: {id: universeId, position: vec}}).then(
              res => {
                if (res.data?.pluginUniverseAddSystem)
                  configStoreApi.setState({
                    selectedObject: res.data.pluginUniverseAddSystem,
                  });
              }
            );
          }}
        >
          {t("Add")}
        </Button>
        <Button
          variantColor="danger"
          variant="ghost"
          size="sm"
          disabled={!selectedObject}
          onClick={deleteObject}
        >
          {t("Delete")}
        </Button>
        <Button
          variantColor="primary"
          variant="ghost"
          size="sm"
          disabled={!selectedObject}
        >
          {t("Edit")}
        </Button>
        <Button
          size="sm"
          variant={measuring ? "solid" : "ghost"}
          variantColor="alert"
          onClick={() =>
            useConfigStore.setState(({measuring}) => ({
              measuring: !measuring,
            }))
          }
          disabled={!selectedObject}
        >
          Measure Distances
        </Button>
        <StarSearch />
      </Stack>
      <Collapse mt={4} isOpen={showingAddOptions}>
        <Stack isInline spacing={2} mt={2}>
          <Menu>
            <MenuButton
              className="ml-2"
              as={Button}
              variantColor="warning"
              size="sm"
              width="auto"
            >
              {t("Add Star")} <FaChevronDown />
            </MenuButton>
            <MenuList>
              <MenuItem>{t("Cancel")}</MenuItem>
              <MenuDivider />
              {starTypesData?.starTypes.map(s => (
                <MenuItem
                  key={s.id}
                  onClick={() =>
                    addStar({
                      variables: {
                        id: universeId,
                        systemId,
                        spectralType: s.spectralType,
                      },
                    })
                  }
                >
                  {s.spectralType} - {s.name} (
                  {Math.round(s.prevalence * 1000) / 10}%)
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton
              className="ml-2"
              as={Button}
              variantColor="success"
              size="sm"
              width="auto"
            >
              {t("Add Planet")} <FaChevronDown />
            </MenuButton>
            <MenuList>
              <MenuItem>{t("Cancel")}</MenuItem>
              <MenuDivider />
              {planetTypesData?.planetTypes.map(p => (
                <MenuItem
                  key={p.id}
                  onClick={() =>
                    addPlanet({
                      variables: {
                        id: universeId,
                        parentId: systemId,
                        classification: p.classification,
                      },
                    })
                  }
                >
                  {p.classification} - {p.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          {isPlanet(selectedObject) && (
            <Menu>
              <MenuButton
                className="ml-2"
                as={Button}
                variantColor="info"
                size="sm"
                width="auto"
              >
                {t("Add Moon")} <FaChevronDown />
              </MenuButton>
              <MenuList>
                <MenuItem>{t("Cancel")}</MenuItem>
                <MenuDivider />
                {planetTypesData?.planetTypes.map(p => (
                  <MenuItem
                    key={p.id}
                    onClick={() =>
                      addMoon({
                        variables: {
                          id: universeId,
                          parentId: selectedObject.id,
                          classification: p.classification,
                        },
                      })
                    }
                  >
                    {p.classification} - {p.name}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          )}
          <StarbaseSpawnMenu sceneRef={sceneRef} />
        </Stack>
      </Collapse>
    </Box>
  );
};

const StarbaseSpawnMenu: React.FC<{
  sceneRef: React.MutableRefObject<SceneRef | undefined>;
}> = ({sceneRef}) => {
  const universeId = useConfigStore(store => store.universeId);
  const systemId = useConfigStore(store => store.systemId);

  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  useOnClickOutside(menuRef, () => {
    setMenuOpen(false);
  });
  const {t} = useTranslation();
  const [dimensions, setDimensions] = React.useState<DOMRect>();
  const {data} = usePluginShipsSubscription({
    variables: {pluginId: universeId},
    skip: !universeId,
  });
  const [addStarbase] = useUniverseAddStarbaseMutation();
  return (
    <>
      <Button
        className="ml-2"
        variantColor="alert"
        size="sm"
        ref={buttonRef}
        onClick={() => {
          setMenuOpen(s => !s);
          buttonRef.current &&
            setDimensions(buttonRef.current.getBoundingClientRect());
        }}
      >
        <Tooltip label={t("Configure spawnable item")}>
          <span className="flex items-center">
            {t("Add Starbase")} <FaChevronDown />
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
            <SearchableList
              items={
                data?.pluginShips.map(s => ({
                  id: s.id,
                  label: s.identity.name,
                  category: s.isShip?.category,
                })) || []
              }
              setSelectedItem={id => {
                setMenuOpen(false);
                // TODO: Spawn ship in starmap
                if (!systemId) return;
                const camera = sceneRef.current?.camera();
                if (!camera) return;
                const vec = new Vector3(0, 0, -100);
                vec.applyQuaternion(camera.quaternion).add(camera.position);
                addStarbase({
                  variables: {
                    pluginId: universeId,
                    systemId,
                    shipId: id,
                    position: vec.multiplyScalar(1 / PLANETARY_SCALE),
                  },
                }).then(res => {
                  // TODO: Automatically select the newly created starbase
                });
              }}
            />
          </div>
        </Portal>
      )}
    </>
  );
};

export default Menubar;
