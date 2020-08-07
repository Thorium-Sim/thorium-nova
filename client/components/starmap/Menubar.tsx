import React from "react";
import {Box, Button, Heading, Input, Stack} from "@chakra-ui/core";
import {FaArrowLeft, FaHome} from "react-icons/fa";
import {Link, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Camera, Vector3} from "three";

interface SceneRef {
  camera: () => Camera;
}

const Menubar: React.FC<{
  sceneRef: React.MutableRefObject<SceneRef | undefined>;
}> = ({sceneRef}) => {
  const {universeId} = useParams();
  const {t} = useTranslation();
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
          }}
        >
          {t("Add")}
        </Button>
        <Button variantColor="danger" variant="ghost" size="sm">
          {t("Delete")}
        </Button>
        <Button variantColor="primary" variant="ghost" size="sm">
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
