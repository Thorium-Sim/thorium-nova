import {useNetRequest} from "client/src/context/useNetRequest";
import {cargoSort} from "./index";

export function CargoList({
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
