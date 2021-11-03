import {Fragment, lazy} from "react";
import {Routes, Route} from "react-router-dom";
import AppContext from "./context/AppContext";
import {useCardDataSubscribe} from "./context/useCardData";

import QuoteOfTheDay from "./components/QuoteOfTheDay";
import Credits from "./components/Credits";
import {WelcomeLogo} from "./components/WelcomeLogo";
import {WelcomeButtons} from "./components/WelcomeButtons";
import {FlightLobby} from "./components/FlightLobby";
import {FaCamera} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {netSend} from "./context/netSend";

const DocLayout = lazy(() => import("./docs"));
const Config = lazy(() => import("./pages/Config"));

const MainPage = () => {
  return (
    <div className="welcome h-full p-12 grid grid-cols-2 grid-rows-2">
      <WelcomeLogo />
      <Credits className="row-start-2 col-start-2" />
      {/* <div>
        <Button
          onClick={() =>
            netSend("flightStart", {flightName: "Test", plugins: []})
          }
          className="btn"
        >
          Start Flight
        </Button>
        <Button
          onClick={() => netSend("flightResume")}
          className="btn btn-success"
        >
          Resume Flight
        </Button>
        <Button
          onClick={() => netSend("dotCreate")}
          className="btn btn-success"
        >
          Add Dot
        </Button>
      </div>
      <CardProvider cardName="clients">
        <CardData />
      </CardProvider> */}
      <WelcomeButtons className="col-start-1 row-start-2" />
      <QuoteOfTheDay />
    </div>
  );
};

const ComponentDemo = lazy(() => import("./pages/ComponentDemo"));
const NoMatch = lazy(() => import("./pages/NotFound"));
const Releases = lazy(() => import("./pages/Releases"));

function AppRoutes() {
  useCardDataSubscribe();
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={window.isHeadless ? <FlightLobby /> : <MainPage />}
        />
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
