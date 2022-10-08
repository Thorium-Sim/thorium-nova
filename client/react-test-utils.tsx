import React, {ReactNode, Suspense} from "react";
import {render as rtlRender, RenderOptions} from "@testing-library/react";
import {MemoryRouter as Router} from "react-router-dom";
import {MockNetRequestContext} from "./src/context/useNetRequest";
import {AllRequestReturns} from "server/src/netRequests";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ThoriumContext} from "./src/context/ThoriumContext";

// @ts-expect-error
global.IS_REACT_ACT_ENVIRONMENT = true;

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

interface OptionsInterface {
  initialRoutes?: string[];
  netRequestData?: Partial<AllRequestReturns>;
}

const queryClient = new QueryClient();

async function render(
  ui: Parameters<typeof rtlRender>[0],
  options?: Omit<RenderOptions, "queries"> & OptionsInterface
) {
  const {initialRoutes = ["/"]} = options || {};
  const Wrapper = ({children}: {children: ReactNode}) => {
    return (
      <Suspense fallback={<p>Suspended in test</p>}>
        <ThoriumContext.Provider value={{} as any}>
          <QueryClientProvider client={queryClient}>
            <MockNetRequestContext.Provider
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
                ...options?.netRequestData,
              }}
            >
              <Router initialEntries={initialRoutes}>{children}</Router>
            </MockNetRequestContext.Provider>
          </QueryClientProvider>
        </ThoriumContext.Provider>
      </Suspense>
    );
  };

  const renderOutput = rtlRender(ui, {wrapper: Wrapper, ...options});
  return {
    netSendSpy,
    setNetSendResponse,
    ...renderOutput,
  };
}

export * from "@testing-library/react";
export {render};
