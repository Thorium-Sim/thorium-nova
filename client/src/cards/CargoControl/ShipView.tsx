import Slider from "@thorium/ui/Slider";
import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useEffect, useState} from "react";
import {Suspense} from "react";
import {useResizeObserver} from "client/src/hooks/useResizeObserver";
import {pixelRatio, useShipMapStore} from "./index";
import {CargoContainerDot} from "./CargoContainerDot";
import {RoomDot} from "./RoomDot";

export function ShipView({
  deckIndex,
  cardLoaded,
}: {
  deckIndex: number;
  cardLoaded: boolean;
}) {
  const cargoRooms = useNetRequest("cargoRooms");

  const {decks, rooms, shipLength} = cargoRooms;
  const cargoContainers = useNetRequest("cargoContainers");

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
  }, [cardLoaded]);

  return (
    <div
      className="h-full w-full justify-self-center overflow-hidden relative select-none mx-16"
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
                    name={room.name}
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
                url={d.backgroundUrl}
                onClick={() => useShipMapStore.setState({selectedRoomId: null})}
                className="pointer-events-auto"
              />
            </div>
          </div>
        ))}
      </Suspense>
      <div className="absolute bottom-0 top-0 left-0 flex items-center justify-center">
        <Slider
          aria-label="Deck Selector"
          value={decks.length - deckIndex}
          onChange={val =>
            useShipMapStore.setState({
              deckIndex: decks.length - (val as number) - 1,
            })
          }
          minValue={0}
          maxValue={decks.length - 1}
          orientation="vertical"
        />
      </div>
    </div>
  );
}
