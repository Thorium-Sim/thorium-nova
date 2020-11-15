import {css} from "@emotion/core";
import React from "react";

const Slider = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
) => {
  return (
    <input
      {...props}
      type="range"
      css={css`
        -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
        width: 100%; /* Specific width is required for Firefox. */
        background: transparent; /* Otherwise white in Chrome */
        pointer-events: auto;
        &::-webkit-slider-thumb {
          -webkit-appearance: none;
        }

        &:focus {
          outline: none; /* Removes the blue border. You should probably do some kind of focus styling for accessibility reasons though. */
        }

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 1rem;
          width: 1rem;
          border-radius: 9999px;
          background-color: #fff;
          cursor: pointer;
          margin-top: -5px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
        }
        &::-webkit-slider-runnable-track {
          width: 100%;
          height: 0.5rem;
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 9999px;
        }

        &:focus::-webkit-slider-runnable-track {
          background: #367ebd;
        }
      `}
    />
  );
};

export default Slider;
