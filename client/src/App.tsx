import {Fragment, lazy} from "react";
import {Routes, Route} from "react-router-dom";
import AppContext from "./context/AppContext";
import {useCardDataSubscribe} from "./context/useCardData";

import QuoteOfTheDay from "./components/QuoteOfTheDay";
import Credits from "./components/Credits";
import {WelcomeLogo} from "./components/WelcomeLogo";
import {WelcomeButtons} from "./components/WelcomeButtons";
import {FlightLobby} from "./components/FlightLobby";

const DocLayout = lazy(() => import("./docs"));

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
    <Routes>
      <Route
        path="/"
        element={window.isHeadless ? <FlightLobby /> : <MainPage />}
      />
      <Route path="/components" element={<ComponentDemo />} />
      <Route path="/releases" element={<Releases />} />
      <Route path="/docs/*" element={<DocLayout />}></Route>
      <Route path="*" element={<NoMatch />} />
    </Routes>
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
