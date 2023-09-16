import {q} from "@client/context/AppContext";
import Button from "@thorium/ui/Button";
import Modal from "@thorium/ui/Modal";
import {toast} from "client/src/context/ToastContext";
import {useMatch, useNavigate, Navigate, Outlet, Link} from "react-router-dom";
import {randomNameGenerator} from "server/src/utils/randomNameGenerator";
import {useFlightQuickStart} from "./FlightQuickStartContext";
import {useMutation} from "@tanstack/react-query";
import {useState} from "react";
function capitalize(val: string) {
  return val.charAt(0).toUpperCase() + val.slice(1);
}
export default function FlightQuickStart() {
  const [flight] = q.flight.active.useNetRequest();
  const [client] = q.client.get.useNetRequest();

  const [isLoading, setIsLoading] = useState(false);

  const [state] = useFlightQuickStart();

  const navigate = useNavigate();

  const match = useMatch("/flight/quick/:step");

  if (!match) return <Navigate to="/flight/quick/crew" replace />;
  if (flight) return <Navigate to="/flight" replace />;
  if (!client.isHost) return <Navigate to="/" replace />;

  const {step} = match.params;

  return (
    <Modal
      isOpen={true}
      setIsOpen={() => {
        navigate("/");
      }}
      title={capitalize(step || "Quick Start")}
    >
      <div className="pt-4">
        <Outlet />
      </div>
      <div className="flex justify-end mt-4 gap-4">
        {step !== "crew" && (
          <Link
            className="btn btn-warning"
            to={step === "mission" ? "ship" : "crew"}
          >
            Prev
          </Link>
        )}
        {step !== "mission" && (
          <Link
            className={`btn btn-primary ${
              step === "ship" && (!state.shipName || !state.shipId)
                ? "btn-disabled"
                : ""
            }`}
            to={step === "crew" ? "ship" : "mission"}
          >
            Next
          </Link>
        )}
        {step === "mission" && (
          <Button
            className="btn-success"
            disabled={isLoading}
            onClick={async () => {
              // TODO November 20, 2021 - Do something with the "Flight Director" parameter
              // once we get Flight Director controls implemented.
              // TODO September 6, 2023 - Add support for multiple player ships
              let {
                crewCount,
                shipName,
                shipId: shipTemplate,
                flightName,
                missionId,
                flightDirector,
                startingPointId: startingPoint,
              } = state;
              if (!shipTemplate) {
                toast({
                  title: "Ship is required",
                  body: "You must select a ship template to start a flight.",
                  color: "warning",
                  action: () => navigate("ship"),
                });
                return;
              }
              if (!shipName) {
                shipName = randomNameGenerator();
              }
              setIsLoading(true);
              await q.flight.start.netSend({
                flightName,
                ships: [
                  {
                    crewCount,
                    shipName,
                    shipTemplate,
                  },
                ],
                missionId,
                startingPoint,
              });
              setIsLoading(false);
            }}
          >
            {isLoading ? "Starting Flight..." : "Start"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
