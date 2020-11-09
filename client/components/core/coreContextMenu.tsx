import React from "react";
import {useShipsSetDesiredDestinationMutation} from "../../generated/graphql";
import {useConfigStore} from "../starmap/configStore";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
import {useRightClick} from "client/helpers/hooks/useRightClick";
import ContextMenu, {ContextMenuOption} from "../ui/ContextMenu";
import useEventListener from "client/helpers/hooks/useEventListener";

export const CanvasContextMenu = () => {
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  useEventListener("pointerdown", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (contextMenuRef.current === target.parentElement) return;
    useConfigStore.setState({contextMenuPosition: null});
  });
  const [setDestination] = useShipsSetDesiredDestinationMutation();

  useRightClick(e => {
    const selectedShips = useSelectedShips.getState().selectedIds;
    if (selectedShips.length > 0) {
      const position = useConfigStore
        .getState()
        .translate2dTo3d?.(e.clientX, e.clientY);
      if (!position) return;
      setDestination({
        variables: {shipPositions: selectedShips.map(id => ({id, position}))},
      });
      return;
    }
    useConfigStore.setState({contextMenuPosition: {x: e.pageX, y: e.pageY}});
  });
  React.useEffect(() => {
    // If the camera zooms in or out, hide the context menu.
    const sub = useConfigStore.subscribe(
      store => useConfigStore.setState({contextMenuPosition: null}),
      store => store.cameraVerticalDistance
    );
    return () => sub();
  }, []);
  const contextMenuPosition = useConfigStore(
    store => store.contextMenuPosition
  );
  if (!contextMenuPosition) return null;
  return (
    <ContextMenu {...contextMenuPosition}>
      <div
        ref={contextMenuRef}
        className="text-white bg-opacity-50 bg-black border border-opacity-25 border-white rounded-sm  text-lg divide-y divide-purple-500 divide-opacity-25 flex flex-col"
      >
        <ContextMenuOption onClick={() => console.log("Spawn")}>
          Spawn Here...
        </ContextMenuOption>
        <ContextMenuOption>Measure Distance</ContextMenuOption>
      </div>
    </ContextMenu>
  );
};
