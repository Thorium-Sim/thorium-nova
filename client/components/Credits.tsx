import {Box, Heading} from "@chakra-ui/core";
import {keyframes, css} from "@emotion/core";
import React from "react";

const creditList = [
  {
    header: "Created By",
    content: "Alex Anderson 🚀",
  },
  {
    header: "Strategy & Design",
    content: "Crystal Anderson 💎",
  },
  {
    header: "Inspiration",
    content: "Victor Williamson 🎓",
  },
  {
    header: "Conceptual Design",
    content: "Matt Ricks 🤔",
  },
  {
    header: "Technical Consultant",
    content: "Brent Anderson 🤓",
  },
  // {
  //   header: "Curve Frame Design",
  //   content: "BJ Warner 🎨 & Todd Rasband 🖌",
  // },
  // {
  //   header: "Glass Frame Design",
  //   content: "Nathan King 👑",
  // },
  // {
  //   header: "Epsilon Design",
  //   content: "Inspired by the Empty Epsilon Bridge Simulator",
  // },
  // {
  //   header: "Clear Frame Design",
  //   content: "Emily Paxman 🕶",
  // },
];

const scrollKeyframes = keyframes`
from {
transform :translateY(100%);
}
to {
  transform:translateY(calc(-100% - 50vh));
}`;

const Credits: React.FC = () => {
  return (
    <Box
      gridArea="credits"
      px={12}
      m={16}
      textAlign="right"
      alignSelf="end"
      // css={css`
      //   animation: ${scrollKeyframes} 60s linear infinite;
      // `}
    >
      {creditList.map(c => (
        <Box key={c.header} mt={4} color="white">
          <Heading size="lg">{c.header}</Heading>
          <Heading size="md" mt="1">
            {c.content}
          </Heading>
        </Box>
      ))}
    </Box>
  );
};

export default Credits;
