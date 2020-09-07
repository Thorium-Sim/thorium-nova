import {
  Box,
  Button,
  Grid,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  Link as StyleLink,
} from "@chakra-ui/core";
import {
  useTemplateShipAssetsSubscription,
  useTemplateShipSetLogoMutation,
  useTemplateShipSetModelMutation,
} from "../../../generated/graphql";
import React from "react";
import {Trans, useTranslation} from "react-i18next";
import UploadWell from "../../ui/uploadWell";
import InfoTip from "../../ui/infoTip";
import {renderGLTFPreview} from "../../../helpers/generateGltfImage";
import {readFile} from "../../../helpers/readFile";
import {Link} from "react-router-dom";

const ShipAssets: React.FC<{onClose: () => void}> = ({onClose}) => {
  const toast = useToast();
  const {t} = useTranslation();
  const id = "2cajg1l9kkda54e0y";
  const pluginId = "test";
  const {data} = useTemplateShipAssetsSubscription({
    variables: {pluginId, id},
  });
  const [setLogo] = useTemplateShipSetLogoMutation();
  const [setModel] = useTemplateShipSetModelMutation();

  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalOverlay></ModalOverlay>
      <ModalContent width="100%" maxWidth="700px">
        <ModalHeader>
          <Heading as="h2" size="lg">
            {t`Ship Assets`}
          </Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Grid
            templateColumns="repeat(2,1fr)"
            templateAreas={`"logo top"
  "model side"
  "empty vanity"`}
            gap={6}
            px={10}
          >
            <Box gridArea="logo">
              <Heading as="h3" size="md">
                {t`Logo`}{" "}
                <InfoTip>{t`Logos should be square and have a transparent background. SVGs work best.`}</InfoTip>
              </Heading>
              <UploadWell
                accept="image/*"
                onChange={(files: FileList) =>
                  setLogo({variables: {id, pluginId, image: files[0]}})
                }
              >
                {data?.pluginShip?.shipAssets.logo && (
                  <Image
                    src={`${
                      data?.pluginShip?.shipAssets.logo
                    }?${new Date().getTime()}`}
                    width="90%"
                    height="90%"
                    objectFit="cover"
                    alt="Ship Logo"
                  />
                )}
              </UploadWell>
            </Box>
            <Box gridArea="model">
              <Heading as="h3" size="md">
                {t`Model`}{" "}
                <InfoTip>
                  <Trans>
                    {/* TODO: Be sure to add a docs page for the model format */}
                    Models should be in .glb format. Top and side views are
                    automatically generated from the model. {/* @ts-ignore */}
                    <StyleLink as={Link} to="/" color="primary.300">
                      Read about how to create compatible models.
                    </StyleLink>
                  </Trans>
                </InfoTip>
              </Heading>
              <UploadWell
                onChange={async files => {
                  toast({
                    title: t("Uploading"),
                    description: t("Model is uploading. Please wait..."),
                    position: "top-right",

                    status: "info",
                  });
                  try {
                    const file = files[0];
                    const result = await readFile(file);
                    const topSrc = await renderGLTFPreview(result, {
                      size: {width: 1200, height: 1200},
                      camera: {fov: 50, x: 0, y: 0, z: 3},
                    });
                    const sideSrc = await renderGLTFPreview(result, {
                      size: {width: 1200, height: 1200},
                      camera: {fov: 50, x: 3, y: 0, z: 0, rotateZ: Math.PI / 2},
                    });
                    const vanitySrc = await renderGLTFPreview(result, {
                      size: {width: 1200, height: 1200},
                      camera: {
                        fov: 60,
                        x: 1.2,
                        y: 1.5,
                        z: 1.2,
                        rotateZ: (3 * Math.PI) / 4,
                      },
                    });

                    await setModel({
                      variables: {
                        id,
                        pluginId,
                        model: file,
                        top: await (await fetch(topSrc)).blob(),
                        side: await (await fetch(sideSrc)).blob(),
                        vanity: await (await fetch(vanitySrc)).blob(),
                      },
                    });
                    toast({
                      title: t("Upload Complete"),
                      status: "success",
                      position: "top-right",
                    });
                  } catch (err) {
                    toast({
                      title: t("Upload Failed"),
                      description: err.message,
                      status: "error",
                      position: "top-right",
                    });
                  }
                }}
              >
                {data?.pluginShip?.shipAssets.vanity && (
                  <Image
                    src={`${
                      data?.pluginShip?.shipAssets.vanity
                    }?${new Date().getTime()}`}
                    width="90%"
                    height="90%"
                    objectFit="cover"
                    alt="Ship Model"
                  />
                )}
              </UploadWell>
            </Box>
            <Box gridArea="top">
              <Heading as="h3" size="md">{t`Top View`}</Heading>
              <UploadWell disabled>
                {data?.pluginShip?.shipAssets.top && (
                  <Image
                    src={`${
                      data?.pluginShip?.shipAssets.top
                    }?${new Date().getTime()}`}
                    width="90%"
                    height="90%"
                    objectFit="cover"
                    alt="Ship Model"
                  />
                )}
              </UploadWell>
            </Box>
            <Box gridArea="side">
              <Heading as="h3" size="md">{t`Side View`}</Heading>
              <UploadWell disabled>
                {data?.pluginShip?.shipAssets.side && (
                  <Image
                    src={`${
                      data?.pluginShip?.shipAssets.side
                    }?${new Date().getTime()}`}
                    width="90%"
                    height="90%"
                    objectFit="cover"
                    alt="Ship Model"
                  />
                )}
              </UploadWell>
            </Box>
          </Grid>
          <ModalFooter>
            <Button variantColor="blue" onClick={onClose}>
              OK
            </Button>
          </ModalFooter>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShipAssets;
