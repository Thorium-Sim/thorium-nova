import {
  flip,
  offset,
  shift,
  useFloating,
  useInteractions,
  useRole,
  useHover,
} from "@floating-ui/react-dom-interactions";
import Button from "@thorium/ui/Button";
import {Tooltip} from "@thorium/ui/Tooltip";
import SearchableInput, {DefaultResultLabel} from "@thorium/ui/SearchableInput";
import Slider from "@thorium/ui/Slider";
import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {CardProps} from "client/src/components/Station/CardProps";
import {netSend} from "client/src/context/netSend";
import {useThorium} from "client/src/context/ThoriumContext";
import {useDataStream} from "client/src/context/useDataStream";
import {netRequest, useNetRequest} from "client/src/context/useNetRequest";
import useAnimationFrame from "client/src/hooks/useAnimationFrame";
import {useEffect, useRef, useState} from "react";
import {Suspense} from "react";
import {FaBoxOpen, FaChevronRight} from "react-icons/fa";
import {MdLogout} from "react-icons/md";
import create from "zustand";
import {useResizeObserver} from "client/src/hooks/useResizeObserver";
import "./style.css";
import {toast} from "client/src/context/ToastContext";
const pixelRatio = window.devicePixelRatio;

const useShipMapStore = create<{
  selectedRoomId: number | null;
  selectedContainerId: number | null;
  deckIndex: number;
}>(set => ({
  selectedRoomId: null,
  selectedContainerId: null,
  deckIndex: 0,
}));

function cargoSort([keyA]: [string, number], [keyB]: [string, number]) {
  return keyA.localeCompare(keyB);
}

export function CargoControl(props: CardProps) {
  const selectedRoomId = useShipMapStore(state => state.selectedRoomId);
  const selectedContainerId = useShipMapStore(
    state => state.selectedContainerId
  );
  const deckIndex = useShipMapStore(state => state.deckIndex);

  const cargoRooms = useNetRequest("cargoRooms");
  const cargoContainers = useNetRequest("cargoContainers");
  useDataStream();
  const {rooms, decks} = cargoRooms;

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedContainer = cargoContainers.find(
    c => c.id === selectedContainerId
  );

  const enRouteContainer = cargoContainers.find(
    container => selectedRoomId && container.destinationNode === selectedRoomId
  );

  const transferAmount = useTransferAmount();

  return (
    <div className="mx-auto h-full relative grid grid-cols-[1fr_30%_50px] grid-rows-2 gap-8">
      <div className="row-span-2">
        <div className="w-1/3 mx-auto z-10">
          <CargoSearchInput />
        </div>
        <ShipView deckIndex={deckIndex} cardLoaded={props.cardLoaded} />
      </div>
      <div className="h-full flex flex-col ">
        <h3 className="text-xl">
          {selectedRoom ? (
            <span className="flex justify-between">
              <span>
                {selectedRoom.name} ({selectedRoom.used} / {selectedRoom.volume}
                )
              </span>
              <GoToRoomButton
                decks={decks}
                selectedRoom={selectedRoom}
                currentDeckIndex={deckIndex}
              />
            </span>
          ) : (
            "Choose a room"
          )}
        </h3>
        <CargoList
          selectedRoom={selectedRoom}
          enRouteContainerId={enRouteContainer?.id}
          selectedContainerId={selectedContainerId}
          onClick={async (key: string) => {
            if (
              selectedRoom?.id &&
              enRouteContainer?.id === selectedContainerId
            ) {
              try {
                await netSend("cargoTransfer", {
                  fromId: {type: "room", id: selectedRoom?.id},
                  toId: {type: "entity", id: selectedContainerId},
                  transfers: [{item: key, count: transferAmount}],
                });
              } catch (err) {
                toast({
                  title: "Error transferring cargo",
                  body: err.message,
                  color: "error",
                });
              }
            }
          }}
        />
        <div className="h-10 w-full flex items-center justify-center">
          {enRouteContainer?.entityState === "enRoute" ? (
            <Button className="w-full btn-disabled" disabled>
              {enRouteContainer.name} En Route
            </Button>
          ) : enRouteContainer?.entityState === "idle" &&
            enRouteContainer.id === selectedContainerId ? (
            <p>Click cargo line to transfer {transferAmount} item</p>
          ) : (
            <Button
              className={`w-full ${
                !selectedRoomId ? "btn-disabled" : "btn-primary"
              }`}
              disabled={!selectedRoomId}
              onClick={() =>
                typeof selectedRoomId === "number" &&
                netSend("cargoContainerSummon", {roomId: selectedRoomId})
              }
            >
              Summon Closest Container
              {selectedRoom?.name ? ` to ${selectedRoom?.name}` : ""}
            </Button>
          )}
        </div>
      </div>

      <CargoContainerList />
      <div className="h-full flex flex-col ">
        <ContainerLabel />
        <CargoList
          selectedRoom={selectedContainer}
          enRouteContainerId={enRouteContainer?.id}
          selectedContainerId={selectedContainerId}
          onClick={async key => {
            if (enRouteContainer?.id === selectedContainerId && selectedRoom) {
              try {
                await netSend("cargoTransfer", {
                  toId: {type: "room", id: selectedRoom.id},
                  fromId: {type: "entity", id: selectedContainerId},
                  transfers: [{item: key, count: transferAmount}],
                });
              } catch (err) {
                toast({
                  title: "Error transferring cargo",
                  body: err.message,
                  color: "error",
                });
              }
            }
          }}
        />

        <Button
          className={`${
            selectedContainer?.destinationNode === selectedRoomId ||
            !selectedRoom ||
            !selectedContainer
              ? "btn-disabled"
              : "btn-primary"
          }`}
          disabled={
            selectedContainer?.destinationNode === selectedRoomId ||
            !selectedRoom ||
            !selectedContainer
          }
          onClick={() =>
            typeof selectedRoomId === "number" &&
            typeof selectedContainerId === "number" &&
            netSend("cargoContainerSummon", {
              roomId: selectedRoomId,
              containerId: selectedContainerId,
            })
          }
        >
          Send Container{selectedRoom?.name ? ` to ${selectedRoom?.name}` : ""}
        </Button>
      </div>
    </div>
  );
}

function ContainerLabel() {
  const selectedContainerId = useShipMapStore(
    state => state.selectedContainerId
  );
  const cargoRooms = useNetRequest("cargoRooms");
  const cargoContainers = useNetRequest("cargoContainers");

  const selectedContainer = cargoContainers.find(
    c => c.id === selectedContainerId
  );

  const containerRoom = cargoRooms.rooms.find(
    room => room.id === selectedContainer?.destinationNode
  );

  return (
    <span className="flex justify-between flex-wrap">
      <h3 className="text-xl ">
        {selectedContainer
          ? `${selectedContainer.name} (${selectedContainer.used} / ${selectedContainer.volume})`
          : "Choose a container"}
      </h3>
      {containerRoom && (
        <span>
          {selectedContainer?.entityState === "enRoute" ? "En route to " : ""}
          {containerRoom?.name}, {containerRoom.deck}
        </span>
      )}
    </span>
  );
}

function CargoSearchInput() {
  return (
    <SearchableInput<{
      id: number;
      name: string;
      count?: number;
      type: "deck" | "room" | "inventory";
      room?: string;
      deck: string;
      deckIndex: number;
      roomId?: number;
    }>
      queryKey="cargo"
      placeholder="Search for rooms, cargo, and containers"
      getOptions={async ({queryKey, signal}) => {
        const result = await netRequest(
          "cargoSearch",
          {query: queryKey[1]},
          {signal}
        );
        return result;
      }}
      ResultLabel={({active, result, selected}) => (
        <DefaultResultLabel active={active} selected={selected}>
          <p>
            {result.name}
            {result.count ? ` (${result.count})` : ""}
          </p>
          {result.type !== "deck" && (
            <p>
              <small>
                {[result.room, result.deck].filter(Boolean).join(", ")}
              </small>
            </p>
          )}
        </DefaultResultLabel>
      )}
      setSelected={value => {
        if (!value) return;
        const {deckIndex, roomId} = value;
        useShipMapStore.setState({deckIndex});
        useShipMapStore.setState({selectedRoomId: roomId || null});
      }}
    />
  );
}
function useTransferAmount() {
  const [transferAmount, setTransferAmount] = useState(1);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      let transferAmount = 1;
      if (event.metaKey) {
        if (event.altKey) {
          transferAmount = 20;
        } else {
          transferAmount = 10;
        }
      } else {
        if (event.altKey) {
          transferAmount = 5;
        }
      }
      setTransferAmount(transferAmount);
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, []);

  return transferAmount;
}

function CargoContainerList() {
  const cargoContainers = useNetRequest("cargoContainers");
  const cargoRooms = useNetRequest("cargoRooms");
  const {rooms} = cargoRooms;

  const selectedRoomId = useShipMapStore(state => state.selectedRoomId);
  const {interpolate} = useThorium();

  return (
    <div className="flex flex-col h-full gap-4 justify-center row-span-2 cursor-pointer">
      {cargoContainers.map(container => {
        const selectedContainerId = useShipMapStore(
          state => state.selectedContainerId
        );
        const isSelected = container.id === selectedContainerId;
        const inRoom = container.destinationNode === selectedRoomId;
        const destinationRoom = rooms.find(
          room => room.id === container.destinationNode
        );
        return (
          <button
            className={`relative flex justify-center items-center text-3xl  transition-colors aspect-square w-full rounded-full border border-white ${
              isSelected
                ? "bg-primary-focus/75 hover:bg-primary-focus"
                : "bg-transparent hover:bg-white/25"
            }`}
            onClick={() => {
              const containerPosition = interpolate(container.id);
              if (!containerPosition) return;
              useShipMapStore.setState({
                deckIndex: Math.round(containerPosition.z || 0),
              });
              useShipMapStore.setState({selectedContainerId: container.id});
            }}
          >
            <FaBoxOpen />
            {inRoom && !isSelected && (
              <Tooltip
                placement="left"
                content={`Container is ${
                  container.entityState === "idle"
                    ? "present in"
                    : "en route to"
                } the selected room.`}
              >
                <div
                  className={`absolute top-0 right-0 rounded-full ${
                    container.entityState === "idle"
                      ? "bg-blue-400"
                      : "bg-orange-400"
                  } w-3 h-3`}
                />
              </Tooltip>
            )}
            {destinationRoom && container.entityState === "enRoute" && (
              <Tooltip
                content={
                  <span>
                    Container is en route to{" "}
                    <span className="inline-block">
                      {destinationRoom.name},
                    </span>{" "}
                    <span className="inline-block">
                      {destinationRoom.deck}.
                    </span>
                  </span>
                }
              >
                <div className="absolute bottom-0 left-0 rounded-full text-xs bg-black p-0.5 border border-white">
                  <FaChevronRight />
                </div>
              </Tooltip>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CargoList({
  selectedRoom,
  enRouteContainerId,
  selectedContainerId,
  onClick,
}: {
  selectedRoom:
    | {id: number; contents: {[inventoryTemplateName: string]: number}}
    | undefined;
  enRouteContainerId: number | undefined;
  selectedContainerId: number | null;
  onClick: (key: string) => Promise<void>;
}) {
  const inventoryTypes = useNetRequest("inventoryTypes");

  return (
    <ul className="panel panel-primary flex-1 overflow-y-auto">
      {selectedRoom &&
        Object.entries(selectedRoom.contents)
          .sort(cargoSort)
          .map(([key, value]) => {
            if (value === 0) return null;
            const inventoryType = inventoryTypes[key];
            let itemVolume = Math.max(
              Math.round(inventoryType.volume * 1000) / 1000,
              0.0001
            );

            return (
              <li
                key={key}
                className={`px-4 py-2 select-none block w-full border border-solid bg-black border-white border-opacity-50 pointer-events-auto ${
                  enRouteContainerId === selectedContainerId
                    ? "cursor-pointer hover:bg-opacity-50 active:bg-white/20"
                    : "cursor-not-allowed"
                }`}
                onClick={() => onClick(key)}
              >
                <div className="flex justify-between flex-wrap">
                  <span className="font-bold">
                    {key} {inventoryType ? `(${itemVolume} / unit)` : ""}
                  </span>
                  <span className="tabular-nums">{value}</span>
                </div>
              </li>
            );
          })}
    </ul>
  );
}

function GoToRoomButton({
  decks,
  currentDeckIndex,
  selectedRoom,
}: {
  decks: {name: string}[];
  currentDeckIndex: number;
  selectedRoom: {deck: string | undefined};
}) {
  const deckIndex = decks.findIndex(d => d.name === selectedRoom.deck);
  if (deckIndex === currentDeckIndex) return null;
  return (
    <Tooltip content="Go To Room">
      <button
        className="px-4 cursor-pointer"
        onClick={() => {
          useShipMapStore.setState({deckIndex});
        }}
        aria-label="Go To Room"
      >
        <MdLogout />
      </button>
    </Tooltip>
  );
}

function ShipView({
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

function RoomDot({
  id,
  position,
  name,
}: {
  id: number;
  name: string;
  position: {x: number; y: number};
}) {
  const selectedRoomId = useShipMapStore(state => state.selectedRoomId);
  const isSelected = selectedRoomId === id;

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
        className="absolute w-4 h-4 cursor-pointer flex"
        style={{
          transform: `translate(calc(${position.x}px - 0.5rem), calc(${position.y}px - 0.5rem))`,
        }}
      >
        <div
          className={`w-4 h-4 ${
            isSelected
              ? "bg-sky-400 ring-2 ring-sky-300 shadow-md"
              : "bg-green-300"
          } rounded-full pointer-events-auto`}
          ref={reference}
          onClick={() => useShipMapStore.setState({selectedRoomId: id})}
          {...getReferenceProps()}
        />
        {isSelected && (
          <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-sky-400"></span>
        )}
      </div>
      {open && (
        <div
          ref={floating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
          }}
          className="text-white text-2xl drop-shadow-xl bg-black/90 border-white/50 border-2 rounded px-2 py-1"
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
  widthScale: number;
}) {
  const {interpolate} = useThorium();
  const dotRef = useRef<HTMLDivElement>(null);
  const selectedContainerId = useShipMapStore(
    state => state.selectedContainerId
  );
  const isSelected = selectedContainerId === props.id;

  useAnimationFrame(() => {
    if (!dotRef.current) return;
    const position = interpolate(props.id);
    if (position) {
      if (Math.round(position.z || 0) === props.deckIndex) {
        dotRef.current.style.display = "flex";
      } else {
        dotRef.current.style.display = "none";
      }
      dotRef.current.style.transform = `translate(calc(${
        position.x * pixelRatio * props.widthScale
      }px - 0.25rem), calc(${
        position.y * pixelRatio * props.widthScale
      }px - 0.25rem))`;
    }
  });

  return (
    <div
      ref={dotRef}
      className={`absolute flex w-2 h-2`}
      style={{
        display:
          Math.round(props.position.z || 0) === props.deckIndex
            ? "flex"
            : "none",
        transform: `translate(calc(${
          props.position?.x || 0
        }px - 0.125rem), calc(${props.position?.y || 0}px - 0.125rem))`,
      }}
    >
      <div
        className={`w-2 h-2 inline-flex rounded-full transition-colors ${
          isSelected ? "bg-purple-500" : "bg-orange-400"
        } relative`}
      ></div>
      {isSelected && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400"></span>
      )}
    </div>
  );
}
