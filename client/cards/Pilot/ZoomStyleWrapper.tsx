import styled from "@emotion/styled";

export const ZoomStyleWrapper = styled.div`
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;

    height: 2.5rem;
    width: 2.5rem;
    border-radius: 9999px;
    border: 2px solid rgba(0, 0, 0, 0.36);
    --tw-bg-opacity: 1;
    background-color: rgba(107, 114, 128, var(--tw-bg-opacity));

    margin-top: 0px;
    cursor: pointer;
    /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
    --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
      var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }
  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: calc(2.5rem + 4px);
    cursor: pointer;
    box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    background: rgba(0, 0, 0, 0.36);
    border-radius: 9999px;
    border: 2px rgba(255, 255, 255, 0.36) solid;
  }

  input[type="range"]:focus::-webkit-slider-runnable-track {
    background: rgba(255, 255, 255, 0.05);
  }
`;
