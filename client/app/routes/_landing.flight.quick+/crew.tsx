import {q} from "@client/context/AppContext";
import {randomNameGenerator} from "@server/utils/randomNameGenerator";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import {useFlightQuickStart} from "../_landing.flight";
import {Icon} from "@thorium/ui/Icon";

const CrewConfig = () => {
  const [state, dispatch] = useFlightQuickStart();
  const [availableStations] = q.station.available.useNetRequest();

  const availableCrewSizes = availableStations
    .map(station => station.stationCount)
    .filter((a, i, arr) => arr.indexOf(a) === i)
    .sort();

  return (
    <>
      <Input
        label="Flight Name"
        value={state.flightName}
        onChange={e => dispatch({type: "flightName", name: e.target.value})}
        inputButton={
          <Button
            className="btn-sm btn-outline btn-notice"
            onClick={() =>
              dispatch({type: "flightName", name: randomNameGenerator()})
            }
          >
            <Icon name="repeat-2" width="2rem" />
          </Button>
        }
      />
      <div className="flex justify-between select-none">
        <div className="flex justify-center items-center border-2 border-white/60 rounded-lg w-64 h-64 my-4 text-[10rem]">
          {state.crewCount}
        </div>
        <div className="flex flex-col items-center justify-around flex-1">
          <button
            className="text-6xl p-2 cursor-pointer hover:text-white/80 active:text-white/50 focus:outline-none focus:ring rounded-full appearance-none"
            onClick={() =>
              dispatch({type: "increaseCrewCount", availableCrewSizes})
            }
          >
            <Icon name="arrow-up" />
          </button>
          <button
            className="text-6xl p-2 cursor-pointer hover:text-white/80 active:text-white/50 focus:outline-none focus:ring rounded-full appearance-none"
            onClick={() =>
              dispatch({type: "decreaseCrewCount", availableCrewSizes})
            }
          >
            <Icon name="arrow-down" />
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
