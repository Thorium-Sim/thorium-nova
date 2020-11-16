import React from "react";
import {
  useShipSpawnMutation,
  useShipsSetDesiredDestinationMutation,
} from "../../generated/graphql";
import {useConfigStore} from "../starmap/configStore";
import {useSelectedShips} from "../viewscreen/useSelectedShips";
import {useRightClick} from "client/helpers/hooks/useRightClick";
import ContextMenu, {ContextMenuOption} from "../ui/ContextMenu";
import useEventListener from "client/helpers/hooks/useEventListener";
import {useTranslation} from "react-i18next";

export const CanvasContextMenu = () => {
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  useEventListener("pointerdown", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (contextMenuRef.current === target.parentElement) return;
    useConfigStore.setState({contextMenuPosition: null});
  });
  const [setDestination] = useShipsSetDesiredDestinationMutation();
  const [shipSpawn] = useShipSpawnMutation();
  useRightClick(e => {
    const selectedShips = useSelectedShips.getState().selectedIds;
    if (selectedShips.length > 0) {
      const position = useConfigStore
        .getState()
        .translate2dTo3d?.(e.clientX, e.clientY);
      if (!position) return;
      setDestination({
        variables: {
          shipPositions: selectedShips.map(id => ({
            id,
            position: {
              x: position.x,
              y: useConfigStore.getState().yDimensionIndex,
              z: position.z,
            },
          })),
        },
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
  const {t} = useTranslation();
  if (!contextMenuPosition) return null;
  return (
    <ContextMenu {...contextMenuPosition}>
      <div
        ref={contextMenuRef}
        className="text-white bg-opacity-50 bg-black border border-opacity-25 border-white rounded-sm  text-lg divide-y divide-purple-500 divide-opacity-25 flex flex-col"
      >
        <ContextMenuOption
          onClick={() => {
            const templateId = useConfigStore.getState().shipSpawnTemplateId;
            // TODO: Give a warning to indicate why you can't spawn a ship (need to set template ID in menubar)
            if (!templateId) return;
            const position = useConfigStore
              .getState()
              .translate2dTo3d?.(contextMenuPosition.x, contextMenuPosition.y);
            if (!position) return;
            shipSpawn({
              variables: {
                systemId: useConfigStore.getState().systemId,
                templateId,
                position: {
                  x: position.x,
                  y: useConfigStore.getState().yDimensionIndex,
                  z: position.z,
                },
              },
            });
            useConfigStore.setState({contextMenuPosition: null});
          }}
        >
          {t("Spawn Here")}
        </ContextMenuOption>
        <ContextMenuOption>{t("Measure Distance")}</ContextMenuOption>
      </div>
    </ContextMenu>
  );
};
