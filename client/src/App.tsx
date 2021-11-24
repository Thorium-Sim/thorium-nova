import {lazy, Suspense} from "react";
import {Routes, Route, Outlet, useNavigate} from "react-router-dom";
import AppContext from "./context/AppContext";
import {useCardDataSubscribe} from "./context/useCardData";

import QuoteOfTheDay from "./components/QuoteOfTheDay";
import Credits from "./components/Credits";
import {WelcomeLogo} from "./components/WelcomeLogo";
import {WelcomeButtons} from "./components/WelcomeButtons";
import {FaCamera} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {netSend} from "./context/netSend";
import LoginButton from "./components/LoginButton";
import FlightQuickStart from "./components/FlightQuickStart";
import {QuickStartProvider} from "./components/FlightQuickStart/FlightQuickStartContext";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";

const DocLayout = lazy(() => import("./docs"));
const Config = lazy(() => import("./pages/Config"));

const MainPage = () => {
  return (
    <>
      <div className="welcome h-full p-12 grid grid-cols-2 grid-rows-2">
        <WelcomeLogo />
        <Credits className="row-start-2 col-start-2" />

        <WelcomeButtons className="col-start-1 row-start-2" />
        <QuoteOfTheDay />
        <LoginButton />
      </div>
      <Outlet />
    </>
  );
};

const ComponentDemo = lazy(() => import("./pages/ComponentDemo"));
const NoMatch = lazy(() => import("./pages/NotFound"));
const Releases = lazy(() => import("./pages/Releases"));
const CrewConfig = lazy(
  () => import("./components/FlightQuickStart/CrewConfig")
);
const ShipConfig = lazy(
  () => import("./components/FlightQuickStart/ShipConfig")
);
const FlightLobby = lazy(() => import("./components/FlightQuickStart/index"));

function AppRoutes() {
  useCardDataSubscribe();
  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage />}>
          <Route
            path="/flight/quick"
            element={
              <QuickStartProvider>
                <FlightQuickStart />
              </QuickStartProvider>
            }
          >
            <Route
              path="crew"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <CrewConfig />
                </Suspense>
              }
            />
            <Route
              path="ship"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ShipConfig />
                </Suspense>
              }
            />

            <Route path="mission" element={null} />
          </Route>
        </Route>
        <Route path="/flight" element={<FlightLobby />} />
        <Route path="/components" element={<ComponentDemo />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/docs/*" element={<DocLayout />}></Route>
        <Route path="/config/*" element={<Config />}></Route>
        <Route path="*" element={<NoMatch />} />
      </Routes>
      <Snapshot />
    </>
  );
}
function Snapshot() {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <Button
      className="btn-circle fixed bottom-2 left-2 btn-ghost"
      onClick={() => {
        netSend("serverSnapshot");
      }}
    >
      <FaCamera />
    </Button>
  );
}
function App() {
  return (
    <AppContext>
      <AppRoutes />
    </AppContext>
  );
}

export default App;
