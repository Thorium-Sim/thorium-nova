import {useLocalStorageReducer} from "client/src/hooks/useLocalStorage";
import * as React from "react";
import {randomNameGenerator} from "server/src/utils/randomNameGenerator";

export interface FlightConfigState {
  crewCount: number;
  flightDirector: boolean;
  flightName: string;
  shipId?: {pluginId: string; shipId: string};
  shipName?: string;
  missionId?: {pluginId: string; missionId: string};
  startingPointId?: {pluginId: string; startingPointId: string};
}

export type FlightConfigAction =
  | {type: "increaseCrewCount"}
  | {type: "decreaseCrewCount"}
  | {type: "hasFlightDirector"; flightDirector: boolean}
  | {type: "shipId"; shipId: {pluginId: string; shipId: string} | undefined}
  | {type: "shipName"; name: string}
  | {
      type: "missionId";
      missionId: {pluginId: string; missionId: string} | undefined;
    }
  | {
      type: "startingPointId";
      startingPointId: {pluginId: string; startingPointId: string} | undefined;
    };

function quickStartReducer(
  state: FlightConfigState,
  action: FlightConfigAction
): FlightConfigState {
  switch (action.type) {
    case "increaseCrewCount":
      return {...state, crewCount: Math.min(12, state.crewCount + 1)};
    case "decreaseCrewCount":
      return {...state, crewCount: Math.max(1, state.crewCount - 1)};
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

    default:
      return state;
  }
}

const QuickStartContext = React.createContext<
  [FlightConfigState, React.Dispatch<FlightConfigAction>]
>(null!);

export const QuickStartProvider = ({children}: {children: React.ReactNode}) => {
  const value = useLocalStorageReducer<
    typeof quickStartReducer,
    FlightConfigState
  >(
    quickStartReducer,
    {
      flightName: randomNameGenerator(),
      crewCount: 6,
      flightDirector: true,
    },
    "flightConfig"
  );

  return (
    <QuickStartContext.Provider value={value}>
      {children}
    </QuickStartContext.Provider>
  );
};

export const useFlightQuickStart = () => React.useContext(QuickStartContext);
