import React from "react";
import {ErrorBoundary} from "react-error-boundary";
import {useClientId} from "c/helpers/getClientId";
import useEasterEgg from "c/helpers/easterEgg";
import {
  useObjectMovementsTSubscription,
  useStartFlightMutation,
} from "./generated/queryHooks";
import useLinearInterpolation from "./helpers/useLinearInterpoloation";
import {css} from "@emotion/core";
const Fallback = () => {
  return <h1>Error</h1>;
};

const Dot: React.FC<{
  index: number;
  storeApi: ReturnType<typeof useObjectMovementsTSubscription>[1];
}> = ({index, storeApi}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const unSub = storeApi.subscribe((state: any) => {
      if (!state) return;
      const Position = state.gameState.objects[index].Position;
      if (ref.current) {
        ref.current.style.transform = `translate(${Position.x * 100 + 50}%, ${
          Position.y * 100 + 50
        }%)`;
      }
    });
    return () => unSub();
  }, [storeApi]);
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: "100vh",
        width: "100vw",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-10px",
          top: "-10px",
          height: "20px",
          width: "20px",
          backgroundColor: "red",
          borderRadius: "50%",
        }}
      ></div>
    </div>
  );
};
const App: React.FC = () => {
  const clientId = useClientId();
  const startFlight = useStartFlightMutation();
  const [useStore, storeApi, errors] = useObjectMovementsTSubscription();
  // useClientSidePrediction(storeApi, "objects");
  useLinearInterpolation(storeApi, "objects");
  const objectCount = useStore(store => store.data?.objects?.length || 0);
  useEasterEgg();

  const onReset = React.useCallback(() => {}, []);
  return (
    <React.Suspense fallback="Loading...">
      <ErrorBoundary FallbackComponent={Fallback} onReset={onReset}>
        <h1>How are you doing!</h1>
        <h2>Client ID: {clientId}</h2>
        <p>Object Count: {objectCount}</p>
        <button
          css={css`
            background-color: red;
          `}
          onClick={() => startFlight()}
        >
          Start Flight
        </button>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100vh",
            width: "100vw",
            pointerEvents: "none",
          }}
        >
          {Array.from({length: objectCount}).map((m, i) => (
            <Dot key={i} index={i} storeApi={storeApi} />
          ))}
        </div>
      </ErrorBoundary>
    </React.Suspense>
  );
};

export default App;
