import {ReactNode} from "react";
import {
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from "react-router-dom";
import {Canvas} from "@react-three/fiber";

import {useContextBridge} from "@react-three/drei";

import {useQueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ThoriumContext} from "client/src/context/ThoriumContext";
import {StarmapStoreContext} from "./starmapStore";

const FAR = 1e27;

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
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </ContextBridge>
    </Canvas>
  );
}
