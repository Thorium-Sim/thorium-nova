import React from "react";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import Credits from "../components/Credits";
import {
  Link as RouterLink,
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import {useActiveFlightQuery, useFlightsQuery} from "../generated/graphql";
import {useTranslation} from "react-i18next";
import Button from "../components/ui/button";
import {NavLink} from "react-router-dom";
import {css} from "@emotion/core";
import QuickStartConfig from "client/components/flightConfig/quickStart";
import NoMatch from "./NotFound";
import {ClientButton} from "client/components/clientLobby/ClientButton";
const Logo = require("../images/logo.svg").default;
const Welcome = () => {
  const {t} = useTranslation("welcome");
  const [show, setShow] = React.useState(false);
  const location = useLocation();
  const match = useMatch("/config/flight/quick");
  const {data} = useFlightsQuery();
  const {data: activeFlightData} = useActiveFlightQuery();
  const hasFlight = !!activeFlightData?.flight?.id;

  return (
    <>
      {(match || location.pathname === "/") && (
        <>
          <div
            className="grid grid-cols-2 grid-rows-2 h-full gap-16"
            css={css`
              grid-template-areas:
                "logo credits"
                "button credits";
            `}
          >
            <div
              className="m-16"
              css={css`
                grid-area: logo;
              `}
            >
              <div className="flex items-end self-start">
                <img
                  draggable={false}
                  src={Logo}
                  alt="Thorium Logo"
                  css={css`
                    max-height: 8rem;
                  `}
                />
                <h1
                  className="text-4xl ml-3"
                  css={css`
                    min-width: 12ch;
                  `}
                >
                  Thorium Nova
                </h1>
              </div>
              <h2 className="text-2xl mt-2">
                <RouterLink
                  className="text-purple-300 hover:text-purple-500"
                  to="/releases"
                >
                  {t("Version {{version}}", {
                    version: require("../../package.json").version,
                  })}
                </RouterLink>
              </h2>
              <ClientButton />
            </div>
            <div className="flex flex-col self-end m-16 space-y-4 max-w-lg">
              {hasFlight ? (
                <Button
                  size="lg"
                  variantColor="primary"
                  variant="outline"
                  as={NavLink}
                  to="/flight"
                >
                  {t(`Go To Flight Lobby`)}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variantColor="primary"
                    variant="outline"
                    as={NavLink}
                    to="/config/flight/quick"
                  >
                    {t(`Quick Start`)}
                  </Button>
                  <Button
                    size="lg"
                    variantColor="secondary"
                    variant="outline"
                    as={NavLink}
                    to="/config/flight"
                  >
                    {t(`Custom Flight`)}
                  </Button>
                  <Button
                    size="lg"
                    variantColor="info"
                    variant="outline"
                    onClick={() => setShow(s => !s)}
                  >
                    {t(`Load a Saved Flight`)}
                  </Button>
                  {show && (
                    <ul className="list-none max-h-full overflow-y-auto border-solid border border-whiteAlpha-500">
                      {data?.flights.length ? (
                        data.flights.map(f => (
                          <li
                            className="p-4 border-b border-solid border-whiteAlpha-500"
                            key={f.id}
                          >
                            <strong>{f.name}</strong>
                            <br />
                            <small>
                              {new Date(f.date).toLocaleDateString()}
                            </small>
                          </li>
                        ))
                      ) : (
                        <li className="p-4 border-b border-solid border-whiteAlpha-500">
                          No Saved Flights
                        </li>
                      )}
                    </ul>
                  )}

                  <Button size="lg" variantColor="warning" variant="outline">
                    {t(`Join a Server`)}
                  </Button>
                  <Button
                    size="lg"
                    variantColor="alert"
                    variant="outline"
                    as={NavLink}
                    {...{to: "/config"}}
                  >
                    {t(`Configure Plugins`)}
                  </Button>
                </>
              )}
            </div>
            <Credits></Credits>
          </div>
          <QuoteOfTheDay />
        </>
      )}
      <Routes>
        <Route path="/" element={null} />
        <Route path="config/flight/quick" element={<QuickStartConfig />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </>
  );
};
export default Welcome;
