import React, {Suspense} from "react";
import {render as rtlRender, RenderOptions} from "@testing-library/react";
import {MemoryRouter as Router} from "react-router-dom";
import {
  CardProxy,
  MockCardDataContext,
  MockClientDataContext,
} from "./src/context/useCardData";
import {DataCardNames} from "./src/utils/cardData";

let netSendResponse: {response: any} = {response: ""};
const netSendSpy = jest.fn((input, params) => netSendResponse);
function setNetSendResponse(response: any) {
  netSendResponse = {response};
}
global.fetch = jest.fn((path: string, {body}: {body: FormData}) => {
  if (path.toLowerCase() === "/netsend") {
    let bodyObj: any = {};
    body.forEach((value, key) => (bodyObj[key] = value));
    const params = JSON.parse(bodyObj.params);
    netSendSpy(bodyObj.input, {...params});
    return Promise.resolve({
      json: () => Promise.resolve(netSendResponse.response),
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({}),
  });
}) as any;

interface OptionsInterface<CardName extends DataCardNames> {
  initialRoutes?: string[];
  cardData?: Required<CardProxy[CardName]>;
}

async function render<CardName extends DataCardNames = "allData">(
  ui: Parameters<typeof rtlRender>[0],
  options?: Omit<RenderOptions, "queries"> & OptionsInterface<CardName>
) {
  const {initialRoutes = ["/"]} = options || {};
  const Wrapper: React.FC = ({children}) => {
    return (
      <Suspense fallback={<p>Suspended in test</p>}>
        <MockClientDataContext.Provider
          value={{
            client: {
              id: "Test",
              name: "Test Client",
              connected: true,
              loginName: "Test User",
            } as any,
            flight: null,
            ship: {
              id: 0,
              components: {
                isPlayerShip: {value: true},
                identity: {name: "Test Ship"},
                isShip: {
                  assets: {
                    logo: "",
                  },
                  category: "Cruiser",
                  registry: "NCC-2016-A",
                  shipClass: "Astra Cruiser",
                },
              },
              alertLevel: 5,
            } as any,
            station: {
              name: "Test Station",
              logo: "",
              cards: [
                {
                  icon: "",
                  name: "Test Card",
                  component: "Login",
                },
              ],
            } as any,
            theme: null,
          }}
        >
          <MockCardDataContext.Provider value={options?.cardData}>
            <Router initialEntries={initialRoutes}>{children}</Router>
          </MockCardDataContext.Provider>
        </MockClientDataContext.Provider>
      </Suspense>
    );
  };

  return {
    netSendSpy,
    setNetSendResponse,
    ...rtlRender(ui, {wrapper: Wrapper, ...options}),
  };
}

export * from "@testing-library/react";
export {render};
