import {Fragment, lazy} from "react";
import {Routes, Route} from "react-router-dom";
import AppContext from "./context/AppContext";
import {useThorium} from "./context/ThoriumContext";
import {useCardDataSubscribe} from "./context/useCardData";

import QuoteOfTheDay from "./components/QuoteOfTheDay";
import Credits from "./components/Credits";
import {WelcomeLogo} from "./components/WelcomeLogo";
import {WelcomeButtons} from "./components/WelcomeButtons";
import {FlightLobby} from "./components/FlightLobby";
import {DocLayout, routes as docRoutes} from "./docs";

// const Dot = () => {};
// const CardData = () => {
//   const data = useCardData<"Clients">();
//   const client = useClientData();
//   const {SI} = useThorium();

//   useAnimationFrame(() => {
//     const entities = SI.calcInterpolation("x y z", "entities")?.state as {
//       id: string;
//       x: number;
//       y: number;
//     }[];
//     entities?.forEach(d => {
//       const el = document.getElementById(`dot-${d.id}`);
//       if (!el) return;
//       el.style.display = "block";
//       el.style.transform = `translate(${d.x + window.innerWidth / 2}px, ${
//         d.y + window.innerHeight / 2
//       }px)`;
//     });
//   });
//   return (
//     <div>
//       <pre className="text-left text-white">
//         Data: {JSON.stringify(data, null, 2)}
//       </pre>
//       <pre className="text-left text-white">
//         Data: {JSON.stringify(client, null, 2)}
//       </pre>
//       <div className="fixed inset-0 z-10 pointer-events-none">
//         {client?.dots?.map(d => {
//           return (
//             <div
//               key={d.id}
//               id={`dot-${d.id}`}
//               style={{display: "none", backgroundColor: d.color}}
//               className="w-8 h-8 absolute rounded-full"
//             />
//           );
//         })}
//       </div>
//     </div>
//   );
// };

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
      <Route path="/docs" element={<DocLayout />}>
        {docRoutes.map(({path, component: Component = Fragment}) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Route>
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
