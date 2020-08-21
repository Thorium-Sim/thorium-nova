import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  PseudoBox,
} from "@chakra-ui/core";
import useWindowMove from "../../helpers/hooks/useWindowMove";
import React from "react";
import {FaMinus, FaTimes} from "react-icons/fa";
import {useTranslation} from "react-i18next";
import useSessionStorage from "../../helpers/hooks/useSessionStorage";

const PropertyPalette: React.FC<{onClose: () => void}> = ({
  children,
  onClose,
}) => {
  const [position, measureRef, mouseDown, remeasure] = useWindowMove(
    useSessionStorage<{x: number; y: number} | null>(
      "nova_starmap_propertyPalette",
      null
    )
  );
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    remeasure();
  }, [open]);
  const {t} = useTranslation();
  return (
    <Box
      opacity={position.x === 0 && position.y === 0 ? 0 : 1}
      ref={measureRef}
      style={{transform: `translate(${position.x}px, ${position.y}px)`}}
      bg="rgba(45,55,72, 0.4)"
      position="fixed"
      minWidth={300}
      top={0}
      borderRadius={4}
      display="flex"
      flexDir="column"
      userSelect="none"
    >
      <PseudoBox
        onMouseDown={mouseDown}
        borderBottomColor="whiteAlpha.400"
        borderBottomWidth={2}
        bg="blackAlpha.300"
        cursor="grab"
        _hover={{bg: "blackAlpha.400"}}
        _active={{bg: "blackAlpha.500", cursor: "grabbing"}}
        height="40px"
        borderTopRightRadius={4}
        borderTopLeftRadius={4}
        display="grid"
        gridTemplateColumns="1fr auto 1fr"
        alignItems="center"
        px={2}
        onDoubleClick={() => setOpen(o => !o)}
      >
        <div></div>
        <Heading fontSize="lg">{t("Property Palette")}</Heading>
        <Flex justifySelf="end">
          <IconButton
            icon={FaMinus}
            variant="ghost"
            size="xs"
            aria-label={t(`Minimize`)}
            onClick={() => setOpen(o => !o)}
          />
          <IconButton
            icon={FaTimes}
            variant="ghost"
            size="xs"
            aria-label={t(`Close`)}
            onClick={onClose}
          />
        </Flex>
      </PseudoBox>
      {open && (
        <Box minHeight="200px" px={4} py={2}>
          {children}
        </Box>
      )}
    </Box>
  );
};

export default PropertyPalette;
