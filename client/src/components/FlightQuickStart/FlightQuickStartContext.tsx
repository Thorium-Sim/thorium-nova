import {useLocalStorageReducer} from "client/src/hooks/useLocalStorage";
import * as React from "react";
import {randomNameGenerator} from "server/src/utils/randomNameGenerator";
import type {FlightStartingPoint} from "server/src/utils/types";

export interface FlightConfigState {
  crewCount: number;
  flightDirector: boolean;
  flightName: string;
  shipId?: {pluginId: string; shipId: string};
  shipName?: string;
  missionId?: {pluginId: string; missionId: string};
  startingPointId?: FlightStartingPoint;
}

export type FlightConfigAction =
  | {type: "increaseCrewCount"; availableCrewSizes: number[]}
  | {type: "decreaseCrewCount"; availableCrewSizes: number[]}
  | {type: "hasFlightDirector"; flightDirector: boolean}
  | {type: "flightName"; name: string}
  | {type: "shipId"; shipId: {pluginId: string; shipId: string} | undefined}
  | {type: "shipName"; name: string}
  | {
      type: "missionId";
      missionId: {pluginId: string; missionId: string} | undefined;
    }
  | {
      type: "startingPointId";
      startingPointId: FlightStartingPoint | undefined;
    };

function quickStartReducer(
  state: FlightConfigState,
  action: FlightConfigAction
): FlightConfigState {
  switch (action.type) {
    case "increaseCrewCount": {
      const currentIndex = action.availableCrewSizes.indexOf(state.crewCount);
      if (currentIndex < action.availableCrewSizes.length - 1) {
        return {
          ...state,
          crewCount: action.availableCrewSizes[currentIndex + 1],
        };
      }
      return state;
    }
    case "decreaseCrewCount": {
      const currentIndex = action.availableCrewSizes.indexOf(state.crewCount);
      if (currentIndex > 0) {
        return {
          ...state,
          crewCount: action.availableCrewSizes[currentIndex - 1],
        };
      }
      return state;
    }
    case "hasFlightDirector":
      return {...state, flightDirector: action.flightDirector};
    case "shipId":
      return {...state, shipId: action.shipId};
    case "shipName":
      return {...state, shipName: action.name};
    case "missionId":
      return {...state, missionId: action.missionId};
    case "startingPointId":
      return {...state, startingPointId: action.startingPointId};
    case "flightName":
      return {...state, flightName: action.name};
    default:
      return state;
  }
}

const QuickStartContext = React.createContext<
  [FlightConfigState, React.Dispatch<FlightConfigAction>]
>(null!);

const QuickStartProvider = ({children}: {children: React.ReactNode}) => {
  const value = useLocalStorageReducer<
    typeof quickStartReducer,
    FlightConfigState
  >(
    quickStartReducer,
    {
      flightName: randomNameGenerator(),
      crewCount: 1,
      flightDirector: false,
      shipName: "Voyager",
      shipId: {pluginId: "Thorium Default", shipId: "Astra Frigate"},
      missionId: {pluginId: "Thorium Default", missionId: "Sandbox"},
    },
    "flightConfig"
  );
  const set = value[1];
  React.useEffect(() => {
    set({
      type: "flightName",
      name: randomNameGenerator(),
    });
  }, [set]);

  return (
    <QuickStartContext.Provider value={value}>
      {children}
    </QuickStartContext.Provider>
  );
};
export default QuickStartProvider;

export const useFlightQuickStart = () => {
  const returnVal = React.useContext(QuickStartContext);
  if (!returnVal)
    throw new Error(
      "useFlightQuickStart must be used within a QuickStartProvider"
    );
  return returnVal;
};
