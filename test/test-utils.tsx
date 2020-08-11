import React from "react";
import {render as rtlRender, RenderOptions} from "@testing-library/react";
import {MockedProvider, MockedResponse} from "@apollo/react-testing";
import {MemoryRouter as Router} from "react-router-dom";
import AppContext from "../client/helpers/appContext";

interface OptionsInterface {
  mocks?: ReadonlyArray<MockedResponse>;
  initialRoutes?: string[];
}

function render(
  ui: Parameters<typeof rtlRender>[0],
  options?: Omit<RenderOptions, "queries"> & OptionsInterface
) {
  const {mocks = [], initialRoutes = ["/"]} = options || {};
  const Wrapper: React.FC = ({children}) => {
    return (
      // @ts-ignore
      <MockedProvider mocks={mocks} addTypename={false}>
        <AppContext>
          <Router initialEntries={initialRoutes}>{children}</Router>
        </AppContext>
      </MockedProvider>
    );
  };

  return rtlRender(ui, {wrapper: Wrapper, ...options});
}

export * from "@testing-library/react";
export {render};
