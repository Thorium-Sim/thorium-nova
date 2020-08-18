import React from "react";
import {
  Box,
  Collapse,
  Input,
  Menu,
  MenuButton,
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
  useUniverseSystemRemoveMutation,
  useUniverseAddStarMutation,
  useStarTypesQuery,
} from "../../generated/graphql";
import {configStoreApi, useConfigStore} from "./configStore";
import Button from "../ui/button";

import {useConfirm} from "../Dialog";
import {useHotkeys} from "react-hotkeys-hook";
import {Link} from "react-router-dom";

interface SceneRef {
  camera: () => Camera;
}

const Menubar: React.FC<{
  sceneRef: React.MutableRefObject<SceneRef | undefined>;
}> = ({sceneRef}) => {
  const [addSystem] = useUniverseAddSystemMutation();
  const [removeSystem] = useUniverseSystemRemoveMutation();
  const [addStar] = useUniverseAddStarMutation();
  const {data: starTypesData} = useStarTypesQuery();
  const {t} = useTranslation();
  const confirm = useConfirm();
  const [showingAddOptions, setShowingAddOptions] = React.useState(false);

  const universeId = useConfigStore(store => store.universeId);
  const systemId = useConfigStore(store => store.systemId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const selectedObject = useConfigStore(store => store.selectedObject);

  useHotkeys("n", () => {
    if (systemId) return;
    const camera = sceneRef.current?.camera();
    if (!camera) return;
    const vec = new Vector3(0, 0, -100);
    vec.applyQuaternion(camera.quaternion).add(camera.position);
    addSystem({variables: {id: universeId, position: vec}}).then(res => {
      if (res.data?.universeTemplateAddSystem)
        configStoreApi.setState({
          selectedObject: res.data.universeTemplateAddSystem,
        });
    });
  });

  async function deleteObject() {
    if (systemId) return;
    const selectedObject = configStoreApi.getState().selectedObject;
    if (!selectedObject) return;
    const doRemove = await confirm({
      header: t("Are you sure you want to remove this planetary system?"),
      body: t("It will remove all of the objects inside of it."),
    });
    if (!doRemove) return;
    removeSystem({
      variables: {id: universeId, systemId: selectedObject.id},
    });

    configStoreApi.setState({selectedObject: null});
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
          <Button variantColor="success" size="sm" width="auto">
            {t("Add Planet")}
          </Button>
        </Stack>
      </Collapse>
    </Box>
  );
};

export default Menubar;
