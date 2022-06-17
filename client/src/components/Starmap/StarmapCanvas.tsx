import {ReactNode} from "react";
import {
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from "react-router-dom";
import {Canvas} from "@react-three/fiber";

import {useContextBridge} from "@react-three/drei";

import {useQueryClient, QueryClientProvider} from "react-query";
import {ThoriumContext} from "client/src/context/ThoriumContext";

const FAR = 1e27;

export default function StarmapCanvas({children}: {children: ReactNode}) {
  const client = useQueryClient();

  const ContextBridge = useContextBridge(ThoriumContext);
  const Location = useContextBridge(UNSAFE_LocationContext);
  const Navigation = useContextBridge(UNSAFE_NavigationContext);
  const RouteContext = useContextBridge(UNSAFE_RouteContext);

  return (
    <Canvas
      onContextMenu={e => {
        e.preventDefault();
      }}
      gl={{antialias: true, logarithmicDepthBuffer: true}}
      camera={{fov: 45, far: FAR}}
      mode="concurrent"
    >
      <Navigation>
        <Location>
          <RouteContext>
            <ContextBridge>
              <QueryClientProvider client={client}>
                {children}
              </QueryClientProvider>
            </ContextBridge>
          </RouteContext>
        </Location>
      </Navigation>
    </Canvas>
  );
}
