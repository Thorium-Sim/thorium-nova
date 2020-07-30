import {Box, PseudoBox} from "@chakra-ui/core";
import {css, Global} from "@emotion/core";
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
    <PseudoBox position="relative" height="100%" className="layout">
      <Box
        zIndex={0}
        position="absolute"
        top="0"
        backgroundPosition="center"
        backgroundSize="cover"
        backgroundImage={`linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 40%,rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%), url(${require("url:./background.jpg")})`}
        opacity={0.7}
        width="100%"
        height="100%"
      ></Box>
      <Box zIndex={1} position="absolute" top="0" height="100%" width="100%">
        <React.Suspense fallback="Loading...">
          <ErrorBoundary FallbackComponent={Fallback} onReset={onReset}>
            {children}
          </ErrorBoundary>
        </React.Suspense>
      </Box>
    </PseudoBox>
  );
};

export default Layout;
