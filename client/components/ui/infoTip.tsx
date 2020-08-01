import {
  Box,
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/core";
import React from "react";
import {FaInfoCircle} from "react-icons/fa";

const InfoTip: React.FC = ({children}) => {
  return (
    <Popover usePortal trigger="hover">
      <PopoverTrigger>
        <Button variant="ghost" size="sm" px={0}>
          <Box
            as={FaInfoCircle}
            display="inline-block"
            color="primary.300"
            size="1rem"
            cursor="pointer"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        zIndex={1400}
        boxShadow="2px 2px 10px rgba(0,0,0,0.5)"
        borderColor="transparent"
      >
        <PopoverArrow />
        <PopoverBody>{children}</PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
export default InfoTip;
