import {css} from "@emotion/core";
import Portal from "@reach/portal";
import {OverlayContainer, OverlayProvider} from "@react-aria/overlays";
import {capitalCase} from "change-case";
import {
  useAllPluginShipsQuery,
  useFlightStartMutation,
  useUniverseObjectsQuery,
} from "client/generated/graphql";
import useLocalStorage from "client/helpers/hooks/useLocalStorage";
import {useLocalStorageReducer} from "client/helpers/hooks/useLocalStorageReducer";
import React from "react";
import {useTranslation} from "react-i18next";
import {FaArrowUp, FaArrowDown} from "react-icons/fa";
import {useNavigate} from "react-router";
import Button from "../ui/button";
import Checkbox from "../ui/Checkbox";
import Input from "../ui/Input";
import {ModalDialog} from "../ui/ModalDialog";
import SearchableList from "../ui/SearchableList";

const QuickStartModal: React.FC<{isOpen: boolean; onClose: () => void}> = ({
  children,
  isOpen,
  onClose,
}) => {
  const {t} = useTranslation();
  return (
    <OverlayProvider className="h-full">
      {children}

      {isOpen && (
        <OverlayContainer>
          <ModalDialog
            title={t("Flight Quick Start")}
            isOpen
            onClose={() => {
              onClose();
            }}
          >
            {children}
          </ModalDialog>
        </OverlayContainer>
      )}
    </OverlayProvider>
  );
};

interface FlightConfigState {
  crewCount: number;
  crewCaptain: boolean;
  flightDirector: boolean;
  shipId?: string;
  shipName?: string;
  missionId?: string;
  startingPointId?: string;
}

type FlightConfigAction =
  | {type: "increaseCrewCount"}
  | {type: "decreaseCrewCount"}
  | {type: "crewCaptain"; captain: boolean}
  | {type: "hasFlightDirector"; flightDirector: boolean}
  | {type: "shipId"; shipId: string | undefined}
  | {type: "shipName"; name: string}
  | {type: "missionId"; missionId: string | undefined}
  | {type: "startingPointId"; startingPointId: string | undefined};

function quickStartReducer(
  state: FlightConfigState,
  action: FlightConfigAction
): FlightConfigState {
  switch (action.type) {
    case "increaseCrewCount":
      return {...state, crewCount: Math.min(12, state.crewCount + 1)};
    case "decreaseCrewCount":
      return {...state, crewCount: Math.max(1, state.crewCount - 1)};
    case "crewCaptain":
      return {...state, crewCaptain: action.captain};
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

function stepReducer(
  state: "crew" | "ship" | "mission",
  action: "next" | "prev"
) {
  switch (action) {
    case "next":
      return state === "crew" ? "ship" : "mission";
    case "prev":
      return state === "mission" ? "ship" : "crew";
    default:
      return state;
  }
}
const QuickStartConfig = () => {
  const navigate = useNavigate();
  const {t} = useTranslation();
  const [plugins] = useLocalStorage<string[]>("selectedPlugins", []);

  const [step, stepDispatch] = React.useReducer(stepReducer, "crew");
  const [state, dispatch] = useLocalStorageReducer<
    typeof quickStartReducer,
    FlightConfigState
  >(
    quickStartReducer,
    {
      crewCount: 6,
      crewCaptain: true,
      flightDirector: true,
    },
    "flightConfig"
  );

  const [startFlight] = useFlightStartMutation({
    variables: {
      name: null,
      plugins,
      simulators: [
        {
          shipId: state.shipId || "",
          shipName: state.shipName || "Player Ship",
          crewCaptain: state.crewCaptain,
          flightDirector: state.flightDirector,
          crewCount: state.crewCount,
          stationComplementId: null,
          missionId:
            state.missionId === "sandbox" ? null : state.missionId || null,
          startingPointId: state.startingPointId || null,
        },
      ],
    },
  });
  return (
    <div className="quick start modal">
      <QuickStartModal isOpen={true} onClose={() => navigate("/")}>
        {step === "crew" && <CrewConfig state={state} dispatch={dispatch} />}
        {step === "ship" && <ShipConfig state={state} dispatch={dispatch} />}
        {step === "mission" && (
          <MissionConfig state={state} dispatch={dispatch} />
        )}
        <div className="flex justify-end mt-4">
          {step !== "crew" && (
            <Button
              className="mr-3"
              variantColor="warning"
              onClick={() => {
                stepDispatch("prev");
              }}
            >
              {t("Back")}
            </Button>
          )}
          <Button
            variantColor="danger"
            onClick={() => {
              navigate("/");
            }}
          >
            {t("Cancel")}
          </Button>
          {step !== "mission" && (
            <Button
              variantColor="primary"
              className="ml-3"
              disabled={step === "ship" && (!state.shipId || !state.shipName)}
              onClick={() => {
                stepDispatch("next");
              }}
            >
              {t("Next")}
            </Button>
          )}
          {step === "mission" && (
            <Button
              variantColor="success"
              className="ml-3"
              onClick={async () => {
                await startFlight();
                navigate("/flight");
              }}
              disabled={
                !state.missionId ||
                (state.missionId === "sandbox" && !state.startingPointId)
              }
            >
              {t("Start Flight")}
            </Button>
          )}
        </div>
      </QuickStartModal>
    </div>
  );
};

const MissionItem: React.FC<{
  state: FlightConfigState;
  dispatch: React.Dispatch<FlightConfigAction>;
}> = ({state, dispatch}) => {
  const {t} = useTranslation();
  const [plugins] = useLocalStorage<string[]>("selectedPlugins", []);
  const [dimensions, setDimensions] = React.useState<DOMRect>();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const {data} = useUniverseObjectsQuery({
    variables: {
      pluginIds: plugins,
    },
  });
  const startingPoint = data?.pluginUniverseGetPersistentObjects.find(
    o => o.id === state.startingPointId
  );
  React.useEffect(() => {
    if (state.startingPointId) {
      if (!startingPoint) {
        dispatch({type: "startingPointId", startingPointId: undefined});
      }
    }
  }, [state.startingPointId, startingPoint, dispatch]);
  const buttonRef = React.useRef<HTMLButtonElement>();
  return (
    <li
      className={`border border-whiteAlpha-300 p-4 transition-all duration-75 rounded-lg cursor-pointer ${
        state.missionId === "sandbox"
          ? "bg-whiteAlpha-200"
          : "bg-blackAlpha-100"
      }`}
      onClick={() => dispatch({type: "missionId", missionId: "sandbox"})}
    >
      <p className="text-lg font-bold block">{t("Sandbox Mode")}</p>
      <p className="py-4">
        {t(
          "Designed for sight-seeing, off-the-cuff missions, or writing a new mission from scratch."
        )}
      </p>
      <p className="font-bold">Starting Point:</p>
      <Button
        variantColor="alert"
        variant="outline"
        ref={buttonRef}
        onClick={() => {
          setMenuOpen(s => !s);
          buttonRef.current &&
            setDimensions(buttonRef.current.getBoundingClientRect());
        }}
      >
        {startingPoint
          ? startingPoint.identity.name
          : t("Choose a starting location")}
      </Button>
      {dimensions && menuOpen && (
        <Portal>
          <div
            className="fixed top-0 left-0 border border-alert-200 bg-opacity-25 bg-alert-800 rounded-sm w-64"
            css={css`
              z-index: 100;
              height: 20rem;
              transform: translate(
                ${dimensions.left}px,
                ${dimensions.bottom + 2}px
              );
            `}
          >
            <SearchableList
              items={
                data?.pluginUniverseGetPersistentObjects.map(s => ({
                  id: s.id,
                  label: s.identity.name,
                  category: capitalCase(s.entityType),
                })) || []
              }
              selectedItem={state.startingPointId}
              setSelectedItem={id => {
                setMenuOpen(false);
                dispatch({type: "startingPointId", startingPointId: id});
              }}
            />
          </div>
        </Portal>
      )}
    </li>
  );
};
const MissionConfig: React.FC<{
  state: FlightConfigState;
  dispatch: React.Dispatch<FlightConfigAction>;
}> = ({state, dispatch}) => {
  const {t} = useTranslation();

  return (
    <div>
      <h4 className="text-3xl font-bold">{t("Mission Selection")}</h4>
      <ul
        css={css`
          max-height: 600px;
        `}
        className="overflow-y-auto flex flex-col space-y-4"
      >
        <MissionItem state={state} dispatch={dispatch} />
      </ul>
    </div>
  );
};
const ShipConfig: React.FC<{
  state: FlightConfigState;
  dispatch: React.Dispatch<FlightConfigAction>;
}> = ({state, dispatch}) => {
  const {t} = useTranslation();
  const [plugins] = useLocalStorage<string[]>("selectedPlugins", []);
  const {data} = useAllPluginShipsQuery({variables: {pluginIds: plugins}});
  const pluginShips = data?.allPluginShips;
  // Clear the shipId if the ship isn't present in the selected plugins.
  React.useEffect(() => {
    if (!pluginShips) return;
    if (!pluginShips?.find(s => s.id === state.shipId)) {
      dispatch({type: "shipId", shipId: undefined});
    }
  }, [dispatch, pluginShips, state.shipId]);

  if (!pluginShips)
    return <div>No ships are present in the selected plugins.</div>;

  return (
    <div>
      <h4 className="text-3xl font-bold">{t("Ship Selection")}</h4>
      <Input
        placeholder="Voyager"
        className="mb-4"
        label={t("Ship Name")}
        labelHidden={false}
        value={state.shipName}
        onChange={e => dispatch({type: "shipName", name: e})}
      />
      <div className="h-64">
        <SearchableList
          selectedItem={state.shipId}
          setSelectedItem={item => dispatch({type: "shipId", shipId: item})}
          items={pluginShips.map(item => ({
            id: item.id,
            label: item.identity.name,
            description: item.identity.description,
            category: item.plugin?.name,
            image: item.shipAssets?.vanity,
          }))}
          renderItem={item => (
            <div>
              <img
                src={item.image}
                alt={item.label}
                className="float-left h-12 w-12 mr-2 bg-blackAlpha-800 rounded-full"
              />
              <p className="font-bold">{item.label}</p>
              <p>{item.description}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
};
const CrewConfig: React.FC<{
  state: FlightConfigState;
  dispatch: React.Dispatch<FlightConfigAction>;
}> = ({state, dispatch}) => {
  const {t} = useTranslation();

  return (
    <>
      <h4 className="text-3xl font-bold">{t("Crew Count")}</h4>
      <div className="flex justify-between select-none">
        <div
          className="flex justify-center items-center border-2 border-whiteAlpha-600 rounded-lg w-64 h-64 my-4"
          css={css`
            font-size: 10rem;
          `}
        >
          {state.crewCount}
        </div>
        <div className="flex flex-col items-center justify-around flex-1">
          <button
            className="text-6xl cursor-pointer hover:text-whiteAlpha-800 active:text-whiteAlpha-500 focus:outline-none focus:ring rounded-full appearance-none"
            onClick={() => dispatch({type: "increaseCrewCount"})}
          >
            <FaArrowUp />
          </button>
          <button
            className="text-6xl cursor-pointer hover:text-whiteAlpha-800 active:text-whiteAlpha-500 focus:outline-none focus:ring rounded-full appearance-none"
            onClick={() => dispatch({type: "decreaseCrewCount"})}
          >
            <FaArrowDown />
          </button>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <Checkbox
          label={t("Crew count includes captain")}
          checked={state.crewCaptain}
          onChange={e =>
            dispatch({type: "crewCaptain", captain: e.target.checked})
          }
        />
        <Checkbox
          label={t("Use Flight Director controls")}
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

export default QuickStartConfig;
