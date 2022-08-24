import {ReactNode, Suspense} from "react";
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
  alpha = true,
  className = "",
}: {
  children: ReactNode;
  shouldRender?: boolean;
  alpha?: boolean;
  className?: string;
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
      className={className}
      onContextMenu={e => {
        e.preventDefault();
      }}
      gl={{antialias: true, logarithmicDepthBuffer: true, alpha}}
      camera={{fov: 45, near: 0.01, far: FAR}}
      frameloop={shouldRender ? "always" : "demand"}
    >
      <ContextBridge>
        <QueryClientProvider client={client}>
          <Suspense fallback={null}>{children}</Suspense>
        </QueryClientProvider>
      </ContextBridge>
    </Canvas>
  );
}
