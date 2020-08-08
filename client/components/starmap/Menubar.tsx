import React from "react";
import {Box, Button, Heading, Input, Stack} from "@chakra-ui/core";
import {FaArrowLeft, FaHome} from "react-icons/fa";
import {Link, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Camera, Vector3} from "three";
import {
  useUniverseAddStarMutation,
  useUnvierseStarRemoveMutation,
} from "../../generated/graphql";
import {useConfigStore} from "./configStore";
import {useConfirm} from "../Dialog";

interface SceneRef {
  camera: () => Camera;
}

const Menubar: React.FC<{
  sceneRef: React.MutableRefObject<SceneRef | undefined>;
}> = ({sceneRef}) => {
  const {universeId} = useParams();
  const [addStar] = useUniverseAddStarMutation();
  const [removeStar] = useUnvierseStarRemoveMutation();
  const {t} = useTranslation();
  const confirm = useConfirm();

  const store = useConfigStore();
  return (
    <Box position="fixed" top={0} left={0} width="100vw" padding={2}>
      <Stack isInline spacing={2}>
        <Button as={Link} to="/" variantColor="info" variant="ghost" size="sm">
          <FaHome />
        </Button>
        <Button
          as={Link}
          to={`/config/universes/${universeId}`}
          variantColor="info"
          variant="ghost"
          size="sm"
        >
          <FaArrowLeft />
        </Button>
        <Button
          variantColor="success"
          variant="ghost"
          size="sm"
          onClick={() => {
            const camera = sceneRef.current?.camera();
            if (!camera) return;
            const vec = new Vector3(0, 0, -30);
            vec.applyQuaternion(camera.quaternion);
            addStar({variables: {id: universeId, position: vec}});
          }}
        >
          {t("Add")}
        </Button>
        <Button
          variantColor="danger"
          variant="ghost"
          size="sm"
          disabled={!store.selectedObject}
          onClick={async () => {
            if (!store.selectedObject) return;
            if (
              !(await confirm({
                header: t("Are you sure you want to remove this star?"),
                body: t("It will remove all of the objects inside of it."),
              }))
            )
              return;
            removeStar({
              variables: {id: universeId, starId: store.selectedObject},
            });
            store.selectedObject = null;
          }}
        >
          {t("Delete")}
        </Button>
        <Button
          variantColor="primary"
          variant="ghost"
          size="sm"
          disabled={!store.selectedObject}
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
    </Box>
  );
};

export default Menubar;
