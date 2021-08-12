import {useState, Suspense, lazy} from "react";
import {useTabId} from "@thorium/tab-id";
import {Routes, Route, Link, useNavigate, NavLink} from "react-router-dom";
import AppContext from "./context/AppContext";
import {useThorium} from "./context/ThoriumContext";
import CardProvider from "./context/CardContext";
import useCardData, {
  useCardDataSubscribe,
  useClientData,
} from "./context/useCardData";

import {usePrompt} from "@thorium/ui/AlertDialog";
import QuoteOfTheDay from "./components/QuoteOfTheDay";
import Credits from "./components/Credits";
import Logo from "./images/logo.svg?url";
import packageJson from "../package.json";
import {FaSpinner} from "react-icons/fa";
import useAnimationFrame from "./hooks/useAnimationFrame";
import Button from "@thorium/ui/Button";
import {Disclosure} from "@headlessui/react";

const WelcomeLogo = ({className}: {className?: string}) => {
  return (
    <div className={className}>
      <div className="flex items-end self-start ">
        <img
          draggable={false}
          src={Logo}
          alt="Thorium Logo"
          className="max-h-32"
        />
        <h1 className="text-4xl ml-3 min-w-[12ch] text-white">Thorium Nova</h1>
      </div>
      <h2 className="text-2xl mt-2">
        <Link className="text-purple-300 hover:text-purple-500" to="/releases">
          Version {packageJson.version}
        </Link>
      </h2>
      {/* <ClientButton /> */}
    </div>
  );
};
const Dot = () => {};
const CardData = () => {
  const data = useCardData<"Clients">();
  const client = useClientData();
  const {SI} = useThorium();

  useAnimationFrame(() => {
    const entities = SI.calcInterpolation("x y z", "entities")?.state as {
      id: string;
      x: number;
      y: number;
    }[];
    entities?.forEach(d => {
      const el = document.getElementById(`dot-${d.id}`);
      if (!el) return;
      el.style.display = "block";
      el.style.transform = `translate(${d.x + window.innerWidth / 2}px, ${
        d.y + window.innerHeight / 2
      }px)`;
    });
  });
  return (
    <div>
      <pre className="text-left text-white">
        Data: {JSON.stringify(data, null, 2)}
      </pre>
      <pre className="text-left text-white">
        Data: {JSON.stringify(client, null, 2)}
      </pre>
      <div className="fixed inset-0 z-10 pointer-events-none">
        {client?.dots?.map(d => {
          return (
            <div
              key={d.id}
              id={`dot-${d.id}`}
              style={{display: "none", backgroundColor: d.color}}
              className="w-8 h-8 absolute rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
};

const WelcomeButtons = ({className}: {className?: string}) => {
  const client = useClientData();

  return (
    <div
      className={`${className} flex flex-col justify-end self-end space-y-4 max-w-md h-full`}
    >
      {client.flight ? (
        <NavLink className="btn btn-primary btn-outline" to="/flight">
          Go To Flight Lobby
        </NavLink>
      ) : (
        <>
          <NavLink
            className="btn btn-primary btn-outline"
            to="/config/flight/quick"
          >
            Quick Start
          </NavLink>
          <NavLink
            className="btn btn-secondary btn-outline"
            to="/config/flight"
          >
            Custom Flight
          </NavLink>
          <Disclosure>
            <Disclosure.Button className="btn btn-info btn-outline">
              Load a Saved Flight
            </Disclosure.Button>
            <Disclosure.Panel
              className="text-white list-none max-h-full overflow-y-auto"
              as="ul"
            >
              {client.flights.length ? (
                client.flights.map(f => (
                  <li className="list-group-item" key={f.id}>
                    <strong>{f.name}</strong>
                    <br />
                    <small>{new Date(f.date).toLocaleDateString()}</small>
                  </li>
                ))
              ) : (
                <>
                  <li className="list-group-item">No Saved Flights</li>
                </>
              )}
            </Disclosure.Panel>
          </Disclosure>

          <Button className="btn btn-warning btn-outline">Join a Server</Button>
          <NavLink className="btn btn-alert btn-outline" to="/config">
            Configure Plugins
          </NavLink>
        </>
      )}
    </div>
  );
};
const MainPage = () => {
  const {netSend} = useThorium();
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

function FlightLobby() {
  const prompt = usePrompt();
  const navigate = useNavigate();
  const {netSend} = useThorium();
  const clientData = useClientData();

  return (
    <div className="flex flex-col justify-center items-center h-full  filter drop-shadow-lg space-y-8">
      <h1 className="text-6xl text-white font-bold">
        Waiting for Flight to Start...
      </h1>
      <FaSpinner className="animate-spin-step text-4xl text-white" />
      <div className="flex items-center gap-4">
        <h2 className="text-4xl text-white font-bold">My Client Name:</h2>
        <div
          className="btn btn-primary"
          onClick={async () => {
            const name = await prompt({
              header: "What is the new client name?",
            });
            if (typeof name === "string") {
              const result = await netSend("clientSetName", {name});
            }
          }}
        >
          {clientData?.client.name || ""}
        </div>
      </div>
      <Button
        className="btn btn-primary btn-lg"
        onClick={async e => {
          const result = await prompt({
            header: "",
            body: "What is the password?",
            inputProps: {type: "password"},
          });
          if (result) {
            navigate("/config");
          }
        }}
      >
        Go to Config
      </Button>
    </div>
  );
}

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
