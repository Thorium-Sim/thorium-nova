import React from "react";
import {render as rtlRender, RenderOptions} from "@testing-library/react";
import {} from "@emotion/core";
import {ThemeProvider} from "emotion-theming";

const Wrapper: React.FC = ({children}) => {
  return <ThemeProvider theme={{}}>{children}</ThemeProvider>;
};
function render(
  ui: Parameters<typeof rtlRender>[0],
  options?: Omit<RenderOptions, "queries">,
) {
  return rtlRender(ui, {wrapper: Wrapper, ...options});
}

export * from "@testing-library/react";
export {render};
