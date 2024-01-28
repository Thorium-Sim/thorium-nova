import {useCallback, useEffect, useRef} from "react";
import {Connector, ConnectorHandle} from "./Connector";

export function SketchyConnector({
  out,
  in: inId,
  cardLoaded,
}: {
  out: number;
  in: number;
  cardLoaded: boolean;
  revalidate: any;
}) {
  const connectorRef = useRef<ConnectorHandle>(null);

  const handleAdjust = useCallback(() => {
    const outDims = document
      .querySelector(`[data-id="${out}"]`)
      ?.getBoundingClientRect();
    const inDims = document
      .querySelector(`[data-id="${inId}"][data-outid="${out}"]`)
      ?.getBoundingClientRect();

    if (outDims && inDims) {
      connectorRef.current?.update({
        from: {
          x: outDims.x + outDims.width / 2,
          y: outDims.y + outDims.height / 2,
        },
        to: {x: inDims.x + inDims.width / 2, y: inDims.y + inDims.height / 2},
        visible: cardLoaded,
      });
    }
  }, [cardLoaded, inId, out]);

  useEffect(() => {
    window.addEventListener("resize", handleAdjust);
    return () => window.removeEventListener("resize", handleAdjust);
  }, [handleAdjust]);

  useEffect(() => {
    handleAdjust();
  });

  return <Connector ref={connectorRef} />;
}
