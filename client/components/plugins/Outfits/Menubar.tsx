import React from "react";
import {Box, Stack} from "@chakra-ui/core";
import {FaArrowLeft, FaHome} from "react-icons/fa";
import Button from "../../ui/button";

import {Link, useParams} from "react-router-dom";
import {css} from "@emotion/core";

const Menubar: React.FC = () => {
  const {pluginId} = useParams();

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

        <Button
          as={Link}
          to={`/config/${pluginId}/edit`}
          variantColor="info"
          variant="ghost"
          size="sm"
        >
          <FaArrowLeft />
        </Button>
      </Stack>
    </Box>
  );
};

export default Menubar;
