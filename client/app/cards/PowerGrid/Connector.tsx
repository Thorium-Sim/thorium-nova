import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface ConnectorHandle {
  update: (points: {
    from: {x: number; y: number};
    to: {x: number; y: number};
    visible: boolean;
  }) => void;
  hide: () => void;
}
export const Connector = memo(
  forwardRef<
    ConnectorHandle,
    {from?: {x: number; y: number}; to?: {x: number; y: number}}
  >(({from, to}, ref) => {
    const innerRef = useRef<SVGPathElement>(null);
    function calcD(from: {x: number; y: number}, to: {x: number; y: number}) {
      const {x, y} =
        innerRef.current?.parentElement?.getBoundingClientRect() || {
          x: 0,
          y: 0,
        };

      return (
        `M ${from.x - x} ${from.y - y} ` +
        `C ${from.x - x + 50} ${from.y - y}, ` +
        `${to.x - x - 50} ${to.y - y}, ` +
        `${to.x - x} ${to.y - y}`
      );
    }

    useImperativeHandle(ref, () => {
      return {
        update({from, to}) {
          if (from.x === 0 && from.y === 0 && to.x === 0 && to.y === 0) {
            innerRef.current?.classList.add("opacity-0");
            return;
          }
          innerRef.current?.setAttribute("d", calcD(from, to));
          innerRef.current?.classList.remove("opacity-0");
        },
        hide() {
          innerRef.current?.classList.add("opacity-0");
        },
      };
    });

    useEffect(() => {
      if (from && to) {
        innerRef.current?.classList.remove("opacity-0");
      }
    }, [from, to]);

    return (
      <path
        className="transition-opacity duration-200"
        ref={innerRef}
        d={from && to ? calcD(from, to) : undefined}
        stroke="#ccc"
        strokeWidth={2}
        fill="transparent"
      />
    );
  })
);
Connector.displayName = "Connector";
