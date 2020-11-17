import React from "react";
import {NavLink} from "react-router-dom";
import lottie from "lottie-web";
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
    <div className="fixed top-0 left-0 right-0">
      <div className="mx-auto max-w-5xl">
        <div
          ref={container}
          css={css`
            width: 500px;
            height: 500px;
            overflow: hidden;
            margin: 0 auto;
          `}
        ></div>
        <h1 className="text-5xl font-bold text-center">
          Uh Oh. We're a little lost.
        </h1>
        <h2 className="text-2xl font-bold text-center">
          <NavLink
            to="/"
            className="text-blue-300 hover:text-blue-500 transition-colors duration-300"
          >
            Better head back home.
          </NavLink>
        </h2>
      </div>
    </div>
  );
};

export default NoMatch;
