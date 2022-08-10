import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  useInteractions,
  useRole,
  useHover,
} from "@floating-ui/react-dom-interactions";
import Button from "@thorium/ui/Button";
import Input from "@thorium/ui/Input";
import PanZoom from "@thorium/ui/PanZoom";
import SearchableList from "@thorium/ui/SearchableList";
import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {CardProps} from "client/src/components/Station/CardProps";
import {netSend} from "client/src/context/netSend";
import {useThorium} from "client/src/context/ThoriumContext";
import {useDataStream} from "client/src/context/useDataStream";
import {useNetRequest} from "client/src/context/useNetRequest";
import useAnimationFrame from "client/src/hooks/useAnimationFrame";
import useMeasure from "client/src/hooks/useMeasure";
import {useMemo, useRef, useState} from "react";
import {Suspense} from "react";
import "./style.css";
const pixelRatio = window.devicePixelRatio;

export function CargoControl(props: CardProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const cargoRooms = useNetRequest("cargoRooms");
  const cargoContainers = useNetRequest("cargoContainers");
  useDataStream();
  const {rooms, decks, shipLength} = cargoRooms;

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const decksMap = useMemo(
    () =>
      decks.reduce((acc: {[key: string]: number}, deck, index) => {
        acc[deck.name] = index;
        return acc;
      }, {}),
    [decks]
  );

  const [deckIndex, setDeckIndex] = useState(0);

  return (
    <div className="mx-auto h-full relative grid grid-cols-3 grid-rows-2 gap-8">
      {/* <div className="row-span-2 h-full flex flex-col">
        <h2 className="text-2xl font-bold">Ship Rooms</h2>
        <SearchableList
          showSearchLabel={false}
          items={rooms.map(room => ({
            id: room.id,
            label: room.name,
            category: room.deck,
          }))}
          selectedItem={selectedRoomId}
          setSelectedItem={id => {
            setSelectedRoomId(id);
            const room = rooms.find(r => r.id === id);
            if (room) {
              setDeckIndex(decks.findIndex(d => d.name === room.deck));
            }
          }}
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
        <ul className="mt-4 panel panel-primary flex-1 overflow-y-auto">
          {selectedRoom &&
            Object.entries(selectedRoom.contents).map(([key, value]) => (
              <li key={key} className="list-group-item">
                <div className="flex justify-between">
                  <span className="font-bold">{key}</span>
                  <span className="tabular-nums">{value}</span>
                </div>
              </li>
            ))}
        </ul>
      </div>
      <div className="flex flex-col h-full col-span-2 justify-self-center row-span-2 gap-4">
        <div className="w-1/2">
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
      </div> */}
      <div className="col-span-2 row-span-2">
        <ShipView deckIndex={deckIndex} setDeckIndex={setDeckIndex} />
      </div>
      {/* <div className="h-full flex flex-col">
        <Button
          className={`${!selectedRoomId ? "btn-disabled" : "btn-primary"}`}
          disabled={!selectedRoomId}
          onClick={() =>
            typeof selectedRoomId === "number" &&
            netSend("cargoContainerSummon", {roomId: selectedRoomId})
          }
        >
          Summon Container
        </Button>
       
      </div> */}
    </div>
  );
}

function ShipView({
  deckIndex,
  setDeckIndex,
}: {
  deckIndex: number;
  setDeckIndex: (index: number) => void;
}) {
  const cargoRooms = useNetRequest("cargoRooms");

  const {decks, rooms, shipLength} = cargoRooms;
  const cargoContainers = useNetRequest("cargoContainers");
  const panRef = useRef<PanZoom>(null);
  return (
    <div className="h-full w-full justify-self-center overflow-hidden relative select-none">
      <Suspense fallback={<div>Loading...</div>}>
        <PanZoom
          // TODO March 3, 2022 - Set the initial pan and zoom state so the item is centered
          style={{width: "100%", outline: "none", flex: 1}}
          className="text-purple-400 h-full overflow-hidden"
          maxZoom={8}
          minZoom={0.5}
          noStateUpdate
          disableDoubleClickZoom
          disabled
          autoCenter
          enableBoundingBox
          ref={panRef}
        >
          {decks.map((d, i) => (
            <div
              className="absolute h-full w-full origin-top pointer-events-none"
              key={d.name}
              style={{
                width: `${shipLength * pixelRatio}px`,
              }}
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
                      name={room.name}
                      position={{
                        x: room.position.x * pixelRatio,
                        y: room.position.y * pixelRatio,
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
                        deckIndex={i}
                      />
                    )
                )}

                <SVGImageLoader url={d.backgroundUrl} />
              </div>
            </div>
          ))}
        </PanZoom>
      </Suspense>
      <div className="absolute bottom-0 top-0 left-0 flex items-center justify-center">
        <input
          type="range"
          className="slider slider-notice rotate-90"
          min={0}
          max={decks.length - 1}
          onChange={evt => setDeckIndex(parseInt(evt.target.value))}
          value={deckIndex}
        />
      </div>
    </div>
  );
}

function RoomDot({
  position,
  name,
}: {
  name: string;
  position: {x: number; y: number};
}) {
  const [open, setOpen] = useState(false);

  const {x, y, reference, floating, strategy, context} = useFloating({
    placement: "left",
    middleware: [offset(10), flip(), shift()],
    open,
    onOpenChange: setOpen,
  });

  const {getReferenceProps, getFloatingProps} = useInteractions([
    useHover(context),
    useRole(context, {role: "tooltip"}),
  ]);

  return (
    <>
      <div
        className="absolute w-full h-full"
        style={{
          transform: `translate(calc(${position.x}px - 0.5rem), calc(${position.y}px - 0.5rem))`,
        }}
      >
        <div
          className="w-4 h-4 bg-white rounded-full pointer-events-auto"
          ref={reference}
          {...getReferenceProps()}
        />
      </div>
      {open && (
        <div
          ref={floating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
          }}
          className="text-white text-2xl drop-shadow-xl"
          {...getFloatingProps()}
        >
          {name}
        </div>
      )}
    </>
  );
}

function CargoContainerDot(props: {
  id: number;
  position: {x: number; y: number; z: number};
  deckIndex: number;
}) {
  const {interpolate} = useThorium();
  const dotRef = useRef<HTMLDivElement>(null);
  useAnimationFrame(() => {
    if (!dotRef.current) return;
    const position = interpolate(props.id);
    if (position) {
      if (Math.round(position.z || 0) === props.deckIndex) {
        dotRef.current.style.display = "block";
      } else {
        dotRef.current.style.display = "none";
      }
      dotRef.current.style.transform = `translate(calc(${
        position.x * pixelRatio
      }px - 0.25rem), calc(${position.y * pixelRatio}px - 0.25rem))`;
    }
  });

  return (
    <div
      ref={dotRef}
      className="w-2 h-2 rounded-full bg-orange-400 absolute"
      style={{
        display:
          Math.round(props.position.z || 0) === props.deckIndex
            ? "block"
            : "none",
        transform: `translate(calc(${
          props.position?.x || 0
        }px - 0.125rem), calc(${props.position?.y || 0}px - 0.125rem))`,
      }}
    ></div>
  );
}
