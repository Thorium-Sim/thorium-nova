import {
  Box,
  Button,
  Grid,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PseudoBox,
  Scale,
} from "@chakra-ui/core";
import sleep from "../helpers/sleep";
import React from "react";
import {useTranslation} from "react-i18next";
import {FaStar, FaTools} from "react-icons/fa";
import {useNavigate, useParams} from "react-router";
import {NavLink} from "react-router-dom";

const ConfigIcon: React.FC<{to: string}> = props => {
  return (
    <PseudoBox
      as={NavLink}
      {...props}
      height="200px"
      width="200px"
      boxShadow="inset 5px 5px 10px rgba(0,0,0,0.1), inset 10px 10px 10px rgba(0,0,0,0.1), inset -2px -2px 10px rgba(0,0,0,0.1)"
      borderRadius="20px"
      bg={"blackAlpha.50"}
      cursor={"pointer"}
      _hover={{bg: "blackAlpha.300"}}
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
    ></PseudoBox>
  );
};

const Config = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const {pluginId} = useParams();
  React.useEffect(() => {
    setIsOpen(true);
  }, []);
  async function onClose() {
    setIsOpen(false);
    await sleep(250);
    navigate("..");
  }
  return (
    <>
      {/* @ts-ignore */}
      <Scale in={isOpen}>
        {/* @ts-ignore */}
        {styles => (
          <Modal isOpen={true} size="full">
            <ModalOverlay zIndex={1500} opacity={styles.opacity} />
            <ModalContent {...styles} maxWidth="960px" zIndex={1600}>
              <ModalHeader fontSize="4xl">
                {t("Plugin Configuration")}
              </ModalHeader>
              <ModalCloseButton onClick={onClose} />
              <Grid
                p={8}
                gridTemplateColumns="repeat(3,1fr)"
                justifyItems="center"
                gap={10}
              >
                <ConfigIcon to={`/starmap/${pluginId}`}>
                  <Box as={FaStar} fontSize="6xl" mb={4} />
                  <Heading fontSize="lg">{t("Universes")}</Heading>
                </ConfigIcon>
                <ConfigIcon to="systems">
                  <Box as={FaTools} fontSize="6xl" mb={4} />
                  <Heading fontSize="lg">{t("Ship Systems")}</Heading>
                </ConfigIcon>
              </Grid>
            </ModalContent>
          </Modal>
        )}
      </Scale>
    </>
  );
};

export default Config;
