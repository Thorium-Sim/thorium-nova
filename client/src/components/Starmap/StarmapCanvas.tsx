import {ReactNode, useEffect} from "react";
import {
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from "react-router-dom";
import {Canvas} from "@react-three/fiber";

import {useContextBridge} from "@react-three/drei";

import {useQueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ThoriumContext} from "client/src/context/ThoriumContext";
import {StarmapStoreContext, useGetStarmapStore} from "./starmapStore";
import {useTranslate2DTo3D} from "client/src/hooks/useTranslate2DTo3D";

const FAR = 1e27;

function StarmapEffects() {
  const to3D = useTranslate2DTo3D();
  const useStarmapStore = useGetStarmapStore();
  useEffect(() => {
    useStarmapStore.setState({translate2DTo3D: to3D});
  }, [to3D]);
  return null;
}

export default function StarmapCanvas({
  children,
  shouldRender = true,
}: {
  children: ReactNode;
  shouldRender?: boolean;
}) {
  const client = useQueryClient();

  const ContextBridge = useContextBridge(
    ThoriumContext,
    UNSAFE_LocationContext,
    UNSAFE_NavigationContext,
    UNSAFE_RouteContext,
    StarmapStoreContext
  );

  return (
    <Canvas
      onContextMenu={e => {
        e.preventDefault();
      }}
      gl={{antialias: true, logarithmicDepthBuffer: true}}
      camera={{fov: 45, far: FAR}}
      frameloop={shouldRender ? "always" : "demand"}
    >
      <ContextBridge>
        <QueryClientProvider client={client}>
          <StarmapEffects />
          {children}
        </QueryClientProvider>
      </ContextBridge>
    </Canvas>
  );
}
