import {css} from "@emotion/core";
import React from "react";
import {ErrorBoundary, FallbackProps} from "react-error-boundary";

const Fallback: React.FC<FallbackProps> = ({error}) => {
  return (
    <>
      <h1>Error</h1>
      <h2>{error?.message}</h2>
    </>
  );
};

const Layout: React.FC = ({children}) => {
  const onReset = React.useCallback(() => {}, []);

  return (
    <div className="layout relative h-full">
      <div
        className="z-0 absolute top-0 bg-center bg-cover opacity-70 w-full h-full"
        css={css`
          background-image: linear-gradient(
              135deg,
              rgba(0, 0, 0, 1) 0%,
              rgba(0, 0, 0, 0) 40%,
              rgba(0, 0, 0, 0) 60%,
              rgba(0, 0, 0, 1) 100%
            ),
            url(${require("./background.jpg").default});
        `}
      ></div>
      <div className="z-1 absolute top-0 w-full h-full">
        <React.Suspense fallback={null}>
          <ErrorBoundary FallbackComponent={Fallback} onReset={onReset}>
            {children}
          </ErrorBoundary>
        </React.Suspense>
      </div>
    </div>
  );
};

export default Layout;
