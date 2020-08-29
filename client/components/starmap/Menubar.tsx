import React from "react";
import {
  Box,
  Collapse,
  Input,
  Menu,
  MenuButton as MenuButtonComp,
  MenuButtonProps,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
} from "@chakra-ui/core";
import {FaArrowLeft, FaHome} from "react-icons/fa";
import {useTranslation} from "react-i18next";
import {Camera, Vector3} from "three";
import {
  useUniverseAddSystemMutation,
  useUniverseObjectRemoveMutation,
  useUniverseAddStarMutation,
  useUniverseAddPlanetMutation,
  useStarTypesQuery,
  usePlanetTypesQuery,
} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "./configStore";
import Button from "../ui/button";

import {useConfirm} from "../Dialog";
import {useHotkeys} from "react-hotkeys-hook";
import {Link} from "react-router-dom";
import {isPlanet} from "./ConfigPalette/utils";

const MenuButton = MenuButtonComp as React.FC<
  MenuButtonProps & {rightIcon: string; variantColor: string}
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
  const hoveredPosition = useConfigStore(store => store.hoveredPosition);
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
      if (res.data?.universeTemplateAddSystem)
        configStoreApi.setState({
          selectedObject: res.data.universeTemplateAddSystem,
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

    configStoreApi.setState({selectedObject: null, selectedPosition: null});
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
    <Box position="fixed" top={0} left={0} width="100vw" padding={2}>
      <Stack isInline spacing={2}>
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
            to={`/config/universes/${universeId}`}
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
                if (res.data?.universeTemplateAddSystem)
                  configStoreApi.setState({
                    selectedObject: res.data.universeTemplateAddSystem,
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
        <Input
          size="sm"
          type="search"
          placeholder="Search..."
          justifySelf="end"
          maxWidth="300px"
        />
        <Button
          size="sm"
          variant="ghost"
          variantColor="alert"
          onClick={() =>
            useConfigStore.setState(({measuring}) => ({
              measuring: !measuring,
            }))
          }
          isActive={measuring}
          disabled={!selectedObject}
        >
          Measure Distances
        </Button>
        {}
      </Stack>
      <Collapse mt={4} isOpen={showingAddOptions}>
        <Stack isInline spacing={2} mt={2}>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon="chevron-down"
              variantColor="warning"
              size="sm"
              width="auto"
            >
              {t("Add Star")}
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
              ml={2}
              as={Button}
              rightIcon="chevron-down"
              variantColor="success"
              size="sm"
              width="auto"
            >
              {t("Add Planet")}
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
                ml={2}
                as={Button}
                rightIcon="chevron-down"
                variantColor="info"
                size="sm"
                width="auto"
              >
                {t("Add Moon")}
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
        </Stack>
      </Collapse>
    </Box>
  );
};

export default Menubar;
