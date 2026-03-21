import { useLocalStorageReducer } from "@thorium/hooks/useLocalStorage";
import { Outlet } from "react-router";
import {
	createContext,
	use,
	useContext,
	useEffect,
	type ReactNode,
} from "react";
import { randomNameGenerator } from "@thorium/utils/operations/randomNameGenerator";
import { produce } from "immer";
import uniqid from "@thorium/utils/uniqid";
import type { FlightStartingPoint } from "@thorium/.server/spawners/flight";

export interface FlightConfigState {
	hasFlightDirector: boolean;
	flightName: string;
	ships: {
		id: string;
		shipId: { pluginId: string; shipId: string };
		name: string;
		crewCount: number;
		bridgeId?: { pluginId: string; bridgeId: string };
	}[];
	missionId?: { pluginId: string; missionId: string };
	startingPointId?: FlightStartingPoint;
	mode: "nova" | "legacy";
}

export type FlightConfigAction =
	| { type: "increaseCrewCount"; id: string; availableCrewSizes: number[] }
	| { type: "decreaseCrewCount"; id: string; availableCrewSizes: number[] }
	| { type: "hasFlightDirector"; hasFlightDirector: boolean }
	| { type: "flightName"; name: string }
	| { type: "shipId"; id: string; shipId: { pluginId: string; shipId: string } }
	| { type: "shipName"; id: string; name: string }
	| {
			type: "addShip";
			name?: string;
			shipId?: { pluginId: string; shipId: string };
	  }
	| { type: "removeShip"; id: string }
	| {
			type: "missionId";
			missionId: { pluginId: string; missionId: string } | undefined;
	  }
	| {
			type: "startingPointId";
			startingPointId: FlightStartingPoint | undefined;
	  }
	| {
			type: "mode";
			mode: "nova" | "legacy";
	  }
	| {
			type: "bridgeId";
			id: string;
			bridgeId: { pluginId: string; bridgeId: string } | undefined;
	  };

function quickStartReducer(
	state: FlightConfigState,
	action: FlightConfigAction,
): FlightConfigState {
	switch (action.type) {
		case "increaseCrewCount": {
			return produce(state, (draft) => {
				const ship = draft.ships.find((ship) => ship.id === action.id);
				if (!ship) return;
				const currentIndex = action.availableCrewSizes.indexOf(ship.crewCount);
				if (currentIndex < action.availableCrewSizes.length - 1) {
					ship.crewCount = action.availableCrewSizes[currentIndex + 1];
				}
			});
		}
		case "decreaseCrewCount": {
			return produce(state, (draft) => {
				const ship = draft.ships.find((ship) => ship.id === action.id);
				if (!ship) return;
				const currentIndex = action.availableCrewSizes.indexOf(ship.crewCount);
				if (currentIndex > 0) {
					ship.crewCount = action.availableCrewSizes[currentIndex - 1];
				}
			});
		}
		case "hasFlightDirector":
			return { ...state, hasFlightDirector: action.hasFlightDirector };
		case "shipId":
			return produce(state, (draft) => {
				for (const ship of draft.ships) {
					if (ship.id === action.id) {
						ship.shipId = action.shipId;
					}
				}
			});
		case "shipName":
			return produce(state, (draft) => {
				for (const ship of draft.ships) {
					if (ship.id === action.id) {
						ship.name = action.name;
					}
				}
			});
		case "addShip":
			return {
				...state,
				ships: [
					...(state.ships || []),
					{
						id: uniqid(),
						name: action.name || randomNameGenerator(),
						shipId: action.shipId || (state.ships || []).at(-1)!.shipId,
						crewCount: (state.ships || []).at(-1)?.crewCount || 1,
					},
				],
			};
		case "removeShip":
			return {
				...state,
				ships: state.ships.filter((ship) => ship.id !== action.id),
			};
		case "missionId":
			return { ...state, missionId: action.missionId };
		case "startingPointId":
			return { ...state, startingPointId: action.startingPointId };
		case "flightName":
			return { ...state, flightName: action.name };
		case "mode":
			return {
				...state,
				mode: action.mode,
				hasFlightDirector:
					action.mode === "legacy" ? true : state.hasFlightDirector,
				missionId: undefined,
			};
		case "bridgeId":
			return produce(state, (draft) => {
				const ship = draft.ships.find((ship) => ship.id === action.id);
				if (ship) {
					ship.bridgeId = action.bridgeId;
				}
			});
		default:
			return state;
	}
}

const QuickStartContext = createContext<
	[FlightConfigState, React.Dispatch<FlightConfigAction>]
>(null!);

export function FlightQuickStartProvider({
	children,
}: { children: ReactNode }) {
	const value = useLocalStorageReducer<
		typeof quickStartReducer,
		FlightConfigState,
		FlightConfigAction
	>(
		quickStartReducer,
		{
			flightName: randomNameGenerator(),
			hasFlightDirector: true,
			mode: "nova",
			ships: [
				{
					id: uniqid(),
					name: "Voyager",
					crewCount: 1,
					shipId: { pluginId: "Thorium Default", shipId: "Astra Frigate" },
				},
			],
			missionId: { pluginId: "Thorium Default", missionId: "Sandbox" },
		},
		"flightConfig",
	);
	const set = value[1];
	const ships = value[0].ships || [];
	useEffect(() => {
		set({
			type: "flightName",
			name: randomNameGenerator(),
		});
	}, [set]);
	useEffect(() => {
		if (ships.length === 0) {
			set({
				type: "addShip",
				name: "Voyager",
				shipId: { pluginId: "Thorium Default", shipId: "Astra Frigate" },
			});
		}
	}, [ships, set]);

	return (
		<QuickStartContext.Provider value={value}>
			{children}
		</QuickStartContext.Provider>
	);
}

export const useFlightQuickStart = () => {
	const returnVal = useContext(QuickStartContext);
	if (!returnVal)
		throw new Error(
			"useFlightQuickStart must be used within a QuickStartProvider",
		);
	return returnVal;
};
