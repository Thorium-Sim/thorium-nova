import {useLiveQuery} from "@thorium/live-query/client";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import {useRef} from "react";
import {useShipMapStore} from "./useShipMapStore";
import {pixelRatio} from "@client/utils/pixelRatio";

export function CargoContainerDot(props: {
  id: number;
  position: {x: number; y: number; z: number};
  deckIndex: number;
  widthScale: number;
}) {
  const {interpolate} = useLiveQuery();
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
