import {
  flip,
  offset,
  shift,
  useFloating,
  useInteractions,
  useRole,
  useHover,
} from "@floating-ui/react-dom-interactions";
import {useState} from "react";
import {useShipMapStore} from "./index";

export function RoomDot({
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
          className="z-50 text-white text-2xl drop-shadow-xl bg-black/90 border-white/50 border-2 rounded px-2 py-1"
          {...getFloatingProps()}
        >
          {name}
        </div>
      )}
    </>
  );
}
