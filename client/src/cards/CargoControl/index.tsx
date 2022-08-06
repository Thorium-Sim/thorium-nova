import Input from "@thorium/ui/Input";
import PanZoom from "@thorium/ui/PanZoom";
import SearchableList from "@thorium/ui/SearchableList";
import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {CardProps} from "client/src/components/Station/CardProps";
import {useNetRequest} from "client/src/context/useNetRequest";
import useMeasure from "client/src/hooks/useMeasure";
import {useMemo, useState} from "react";

const pixelRatio = window.devicePixelRatio;

export function CargoControl(props: CardProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const cargoRooms = useNetRequest("cargoRooms");
  const cargoContainers = useNetRequest("cargoContainers");
  const {rooms, decks, shipLength} = cargoRooms;

  const decksMap = useMemo(
    () =>
      decks.reduce((acc: {[key: string]: number}, deck, index) => {
        acc[deck.name] = index;
        return acc;
      }, {}),
    [decks]
  );

  return (
    <div className="mx-auto h-full relative grid grid-cols-4 grid-rows-2 gap-8">
      <div className="row-span-2 h-full flex flex-col">
        <h2 className="text-2xl font-bold">Ship Rooms</h2>
        <SearchableList
          showSearchLabel={false}
          items={rooms.map(room => ({
            id: room.id,
            label: room.name,
            category: room.deck,
          }))}
          selectedItem={selectedRoomId}
          setSelectedItem={setSelectedRoomId}
          categorySort={([a], [b]) => {
            const aIndex = decksMap[a];
            const bIndex = decksMap[b];
            return aIndex - bIndex;
          }}
        />
      </div>
      <div className="flex flex-col h-full">
        <h2 className="text-2xl font-bold">Room Cargo</h2>

        <Input
          as="input"
          label="Search"
          labelHidden
          placeholder="Search Ship Cargo"
        />
        <div className="mt-4 panel panel-primary flex-1 overflow-y-auto"></div>
      </div>
      <div className="flex flex-col h-full col-span-2 w-1/2 justify-self-center">
        <h2 className="text-2xl font-bold">Containers</h2>
        <ul className="panel panel-primary overflow-y-auto">
          {cargoContainers.map(container => (
            <li key={container.id} className="list-group-item">
              <div className="w-full flex justify-between">
                <span className="text-lg text-bold">{container.name}</span>
                <span>{decks[container.position?.z || 0].name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-full flex flex-col">
        <h2 className="text-2xl font-bold">Container Cargo</h2>
        <div className="panel panel-primary flex-1"></div>
      </div>
      <ShipView />
    </div>
  );
}

function ShipView() {
  const cargoRooms = useNetRequest("cargoRooms");

  const {decks, shipLength} = cargoRooms;

  const [containerRef, containerDimensions] = useMeasure<HTMLDivElement>();
  const [imageRef, imageDimensions] = useMeasure<HTMLImageElement>();

  const widthScale = containerDimensions.width / imageDimensions.width;
  const heightScale = containerDimensions.height / imageDimensions.height;
  const scale = Math.min(widthScale, heightScale);
  return (
    <div
      className="h-full panel col-span-2 overflow-hidden relative select-none"
      ref={containerRef}
    >
      <input type="range" className="slider slider-notice max-w-sm rotate=" />

      <PanZoom
        style={{width: "100%", outline: "none", flex: 1}}
        className="h-full text-purple-400 overflow-hidden select-none"
        maxZoom={8}
        minZoom={0.5}
        noStateUpdate={false}
        disableDoubleClickZoom
      >
        <SVGImageLoader
          style={{
            width: `${shipLength * pixelRatio}px`,
            opacity:
              imageDimensions.x === 0 || containerDimensions.x === 0 ? 0 : 1,
            transform: `scale(${scale})`,
            transformOrigin: "top right",
            position: "absolute",
            right: 0,
          }}
          url={decks[0].backgroundUrl}
          ref={imageRef}
        />
      </PanZoom>
    </div>
  );
}
