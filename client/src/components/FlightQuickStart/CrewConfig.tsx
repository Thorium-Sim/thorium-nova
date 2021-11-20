import Checkbox from "@thorium/ui/Checkbox";
import {useNetRequest} from "client/src/context/useNetRequest";
import {FaArrowDown, FaArrowUp} from "react-icons/fa";
import {useFlightQuickStart} from "./FlightQuickStartContext";

const CrewConfig = () => {
  const [state, dispatch] = useFlightQuickStart();
  const availableStations = useNetRequest("availableStationsList");

  const availableCrewSizes = availableStations
    .map(station => station.stationCount)
    .filter((a, i, arr) => arr.indexOf(a) === i)
    .sort();
  console.log(availableCrewSizes);
  return (
    <>
      <div className="flex justify-between select-none">
        <div className="flex justify-center items-center border-2 border-whiteAlpha-600 rounded-lg w-64 h-64 my-4 text-[10rem]">
          {state.crewCount}
        </div>
        <div className="flex flex-col items-center justify-around flex-1">
          <button
            className="text-6xl p-2 cursor-pointer hover:text-whiteAlpha-800 active:text-whiteAlpha-500 focus:outline-none focus:ring rounded-full appearance-none"
            onClick={() =>
              dispatch({type: "increaseCrewCount", availableCrewSizes})
            }
          >
            <FaArrowUp />
          </button>
          <button
            className="text-6xl p-2 cursor-pointer hover:text-whiteAlpha-800 active:text-whiteAlpha-500 focus:outline-none focus:ring rounded-full appearance-none"
            onClick={() =>
              dispatch({type: "decreaseCrewCount", availableCrewSizes})
            }
          >
            <FaArrowDown />
          </button>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <Checkbox
          label="Use Flight Director controls"
          checked={state.flightDirector}
          onChange={e =>
            dispatch({
              type: "hasFlightDirector",
              flightDirector: e.target.checked,
            })
          }
        />
      </div>
    </>
  );
};

export default CrewConfig;
