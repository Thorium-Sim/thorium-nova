import React from "react";
import {css} from "@emotion/core";

const TestFile: React.FC = () => {
  const [state, setState] = React.useState(0);
  return (
    <>
      <h1
        css={css`
          font-size: 2rem;
          color: red;
        `}
      >
        Howdy there!: {state}
      </h1>
      <button onClick={() => setState(state => ++state)}>Plus</button>
    </>
  );
};

export default TestFile;
