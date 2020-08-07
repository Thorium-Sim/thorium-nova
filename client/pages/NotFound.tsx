import React from "react";
import {NavLink} from "react-router-dom";
import lottie from "lottie-web";
import {Box, Heading, Link} from "@chakra-ui/core";
import {css} from "@emotion/core";

const NoMatch = () => {
  const container = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function loadAnimation() {
      if (container.current) {
        const animationData = (await import("./astronaout.json")).default;
        const config = {
          container: container.current,
          autoplay: true,
          loop: true,
          animationData,
        };
        lottie.loadAnimation(config);
      }
    }

    loadAnimation();
  }, []);
  return (
    <Box maxWidth="960px" margin="0 auto">
      <div
        ref={container}
        css={css`
          width: 500px;
          height: 500px;
          overflow: hidden;
          margin: 0 auto;
        `}
      ></div>
      <Heading as="h1" size="2xl" textAlign="center">
        Uh Oh. We're a little lost.
      </Heading>
      <Heading as="h2" size="lg" textAlign="center">
        <Link color="blue.200">
          <NavLink to="/">Better head back home.</NavLink>
        </Link>
      </Heading>
    </Box>
  );
};

export default NoMatch;
