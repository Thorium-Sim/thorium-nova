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
import {css} from "@emotion/core";
import React, {Suspense} from "react";
import {FaStar} from "react-icons/fa";
import {Route, Routes, useNavigate} from "react-router";
import {NavLink} from "react-router-dom";

const UniversesList = React.lazy(() =>
  import("../components/starmap/universesList")
);

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
const sleep = (duration: number) =>
  new Promise(resolve => setTimeout(resolve, duration));
const Config = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    setIsOpen(true);
  }, []);
  async function onClose() {
    setIsOpen(false);
    await sleep(250);
    navigate("/");
  }
  return (
    <>
      {/* @ts-ignore */}
      <Scale in={isOpen}>
        {/* @ts-ignore */}
        {styles => (
          <Modal isOpen={true} size="full">
            <ModalOverlay
              css={css`
                backdrop-filter: blur(50px);
              `}
              opacity={styles.opacity}
            />
            <ModalContent {...styles} maxWidth="960px">
              <ModalHeader fontSize="4xl">Plugin Configuration</ModalHeader>
              <ModalCloseButton onClick={onClose} />
              <Grid
                p={8}
                gridTemplateColumns="repeat(3,1fr)"
                justifyItems="center"
                gap={10}
              >
                <ConfigIcon to="universes">
                  <Box as={FaStar} fontSize="6xl" mb={4} />
                  <Heading fontSize="lg">Universes</Heading>
                </ConfigIcon>
              </Grid>
              <ModalFooter>
                <Button variantColor="blue" onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </Scale>
      <Suspense fallback={null}>
        <Routes>
          <Route path="universes" element={<UniversesList />} />
          <Route path="universes/:universeId" element={<UniversesList />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default Config;
