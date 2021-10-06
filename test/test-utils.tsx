import React from "react";
import {render as rtlRender, RenderOptions} from "@testing-library/react";
import {MemoryRouter as Router} from "react-router-dom";
import AppContext from "../client/src/context/AppContext";

interface OptionsInterface {
  initialRoutes?: string[];
}

function render(
  ui: Parameters<typeof rtlRender>[0],
  options?: Omit<RenderOptions, "queries"> & OptionsInterface
) {
  const {initialRoutes = ["/"]} = options || {};
  const Wrapper: React.FC = ({children}) => {
    return (
      <AppContext>
        <Router initialEntries={initialRoutes}>{children}</Router>
      </AppContext>
    );
  };

  return rtlRender(ui, {wrapper: Wrapper, ...options});
}

export * from "@testing-library/react";
export {render};
