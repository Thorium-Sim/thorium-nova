import {TooltipPopup, useTooltip} from "@reach/tooltip";
import Portal from "@reach/portal";
import React, {cloneElement, Fragment} from "react";
import "@reach/tooltip/styles.css";
type PRect = Partial<DOMRect> & {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
};

const centered = (triggerRect?: PRect | null, tooltipRect?: PRect | null) => {
  if (!triggerRect || !tooltipRect)
    return {
      left: 0,
      top: 0,
    };
  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const left = triggerCenter - tooltipRect.width / 2;
  const maxLeft = window.innerWidth - tooltipRect.width - 2;
  return {
    left: Math.min(Math.max(2, left), maxLeft) + window.scrollX,
    top: triggerRect.bottom + 8 + window.scrollY,
  };
};

export const Tooltip = ({
  children,
  label,
  "aria-label": ariaLabel = label,
}: {
  children: React.ReactElement;
  label: string;
  "aria-label"?: string;
}) => {
  // get the props from useTooltip
  const [trigger, tooltip] = useTooltip();
  // destructure off what we need to position the triangle
  const {isVisible, triggerRect} = tooltip;
  return (
    <Fragment>
      {cloneElement(children, trigger)}
      {isVisible && (
        // The Triangle. We position it relative to the trigger, not the popup
        // so that collisions don't have a triangle pointing off to nowhere.
        // Using a Portal may seem a little extreme, but we can keep the
        // positioning logic simpler here instead of needing to consider
        // the popup's position relative to the trigger and collisions
        <Portal>
          <div
            style={{
              position: "absolute",
              left: triggerRect
                ? triggerRect.left - 10 + triggerRect.width / 2
                : 0,
              top: triggerRect ? triggerRect.bottom + window.scrollY : 0,
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "10px solid black",
            }}
          />
        </Portal>
      )}
      <TooltipPopup
        {...tooltip}
        label={label}
        aria-label={ariaLabel}
        style={{
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "3px",
          padding: "0.5em 1em",
        }}
        position={centered}
      />
    </Fragment>
  );
};
