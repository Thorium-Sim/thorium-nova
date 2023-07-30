import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {useEffect, useState} from "react";
import {Suspense} from "react";
import {useResizeObserver} from "@client/hooks/useResizeObserver";
import {useShipMapStore} from "./useShipMapStore";
import {CargoContainerDot} from "./CargoContainerDot";
import {RoomDot} from "./RoomDot";
import {q} from "@client/context/AppContext";

const pixelRatio = window.devicePixelRatio;

export function ShipView({
  deckIndex,
  cardLoaded,
}: {
  deckIndex: number;
  cardLoaded: boolean;
}) {
  const [cargoRooms] = q.cargoControl.rooms.useNetRequest();

  const {decks, rooms, shipLength} = cargoRooms;
  const [cargoContainers] = q.cargoControl.containers.useNetRequest();

  const [ref, dims, measure] = useResizeObserver();
  const [imgRef, imgDims, imgMeasure] = useResizeObserver();

  const transform = {
    x: dims.width / 2 - imgDims.width / 2,
    y: dims.height / 2 - imgDims.height / 2,
    widthScale: imgDims.width / pixelRatio / shipLength,
  };

  const [transformationLoaded, setTransformationLoaded] = useState(false);

  useEffect(() => {
    if (!cardLoaded) setTransformationLoaded(false);
    else {
      setTimeout(() => {
        measure();
        imgMeasure();
        setTransformationLoaded(true);
      }, 200);
    }
  }, [cardLoaded, imgMeasure, measure]);

  return (
    <div
      className="h-full w-full justify-self-center overflow-hidden relative select-none"
      ref={ref}
    >
      <Suspense fallback={null}>
        {decks.map((d, i) => (
          <div
            className="absolute w-full origin-top pointer-events-none"
            key={d.name}
            style={{
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              transition: "opacity 0.2s ease",
              opacity: transformationLoaded ? 1 : 0,
            }}
            ref={i === 0 ? imgRef : null}
          >
            <div
              className={`relative transition-all duration-500  ${
                deckIndex === i
                  ? "deck-on"
                  : deckIndex < i
                  ? "deck-before"
                  : "deck-after"
              }`}
            >
              {rooms.map(room =>
                room.deck === d.name ? (
                  <RoomDot
                    key={room.id}
                    id={room.id}
                    name={room.name || ""}
                    position={{
                      x: room.position.x * pixelRatio * transform.widthScale,
                      y: room.position.y * pixelRatio * transform.widthScale,
                    }}
                  />
                ) : null
              )}
              {cargoContainers.map(
                container =>
                  container.position && (
                    <CargoContainerDot
                      key={container.id}
                      id={container.id}
                      position={container.position}
                      widthScale={transform.widthScale}
                      deckIndex={i}
                    />
                  )
              )}

              <SVGImageLoader
                url={d.backgroundUrl || ""}
                onClick={() => useShipMapStore.setState({selectedRoomId: null})}
                className="pointer-events-auto"
              />
            </div>
          </div>
        ))}
      </Suspense>
    </div>
  );
}
