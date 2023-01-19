import {autoPlacement, useFloating} from "@floating-ui/react-dom-interactions";
import {Portal} from "@headlessui/react";
import {useGetStarmapStore} from "@client/components/Starmap/starmapStore";
import {toast} from "@client/context/ToastContext";
import useEventListener from "@client/hooks/useEventListener";
import {useRightClick} from "@client/hooks/useRightClick";
import {useEffect, RefObject, useState} from "react";
import {q} from "@client/context/AppContext";

function makeVirtualEl({x: X, y: Y}: {x: number; y: number}) {
  const virtualEl = {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x: X,
        y: Y,
        top: Y,
        left: X,
        right: X,
        bottom: Y,
      };
    },
  };
  return virtualEl;
}

export const StarmapCoreContextMenu = ({
  parentRef,
}: {
  parentRef: RefObject<HTMLDivElement>;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const useStarmapStore = useGetStarmapStore();

  const {x, y, reference, floating, strategy, refs} = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "right-start",
    middleware: [autoPlacement()],
  });

  useEventListener("pointerdown", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (refs.floating.current === target.parentElement) return;
    setOpen(false);
  });

  useRightClick(e => {
    e.preventDefault();
    const selectedShips = useStarmapStore.getState().selectedObjectIds;
    if (selectedShips.length > 0) {
      const position = useStarmapStore
        .getState()
        .translate2DTo3D?.(e.clientX, e.clientY);
      if (!position) return;
      q.starmapCore.setDestinations.netSend({
        ships: selectedShips.map((id: any) => ({
          id,
          position: {
            x: position.x,
            y: useStarmapStore.getState().yDimensionIndex,
            z: position.z,
          },
          systemId: useStarmapStore.getState().currentSystem,
        })),
      });
      return;
    }

    setOpen(true);
    const virtualEl = makeVirtualEl({x: e.clientX, y: e.clientY});
    reference(virtualEl);
  }, parentRef);

  const cameraObjectDistance = useStarmapStore(
    store => store.cameraObjectDistance
  );
  useEffect(() => {
    // If the camera zooms in or out, hide the context menu.
    setOpen(false);
  }, [cameraObjectDistance]);

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={floating}
        style={{
          position: strategy,
          top: y ?? "",
          left: x ?? "",
        }}
        className="text-white bg-opacity-50 bg-black border border-opacity-25 border-white rounded-sm  text-lg divide-y divide-purple-500 divide-opacity-25 flex flex-col"
      >
        <button
          className="px-2 py-1  text-left cursor-pointer hover:bg-purple-700 hover:bg-opacity-50 focus:outline-none focus:ring transition-all"
          onClick={async () => {
            const template = useStarmapStore.getState().spawnShipTemplate;
            // TODO: Give a warning to indicate why you can't spawn a ship (need to set template ID in menubar)
            if (!template) {
              toast({
                title: "Cannot Spawn Ship",
                body: "Please choose a template to spawn from the menubar.",
                color: "error",
              });
              setOpen(false);
              return;
            }
            if (typeof x !== "number" || typeof y !== "number") return;

            const position = useStarmapStore.getState().translate2DTo3D?.(x, y);
            if (!position) return;

            await q.ship.spawn.netSend({
              systemId: useStarmapStore.getState().currentSystem,
              template: {id: template.id, pluginName: template.pluginName},
              position: {
                x: position.x,
                y: useStarmapStore.getState().yDimensionIndex,
                z: position.z,
              },
            });
            setOpen(false);
          }}
        >
          Spawn Here
        </button>
        <button className="px-2 py-1  text-left cursor-pointer hover:bg-purple-700 hover:bg-opacity-50 focus:outline-none focus:ring transition-all">
          Measure Distance
        </button>
      </div>
    </Portal>
  );
};
