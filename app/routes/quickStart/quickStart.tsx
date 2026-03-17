import { Outlet } from "react-router";
import { useNavigate, useMatch, Link } from "react-router";
import { q, clientId } from "@thorium/context/AppContext";
import Modal from "@thorium/ui/Modal";
import { capitalCase } from "change-case";
import Button from "@thorium/ui/Button";
import { toast } from "@thorium/context/ToastContext";
import { Navigate } from "@thorium/components/Navigate";
import { useFlightQuickStart } from "@thorium/routes/quickStart/quickStartContext";
import { randomNameGenerator } from "@thorium/utils/operations/randomNameGenerator";

export default function FlightQuickStart() {
	const [flight] = q.flight.active.useNetRequest();
	const [client] = q.client.get.useNetRequest({ clientId });
	const flightStart = q.flight.start.useNetSend();

	const [state, dispatch] = useFlightQuickStart();

	const navigate = useNavigate();

	const match = useMatch("/flight/quick/:step");

	if (!match) return <Navigate to="/flight/quick/ship" replace />;
	if (flight) return <Navigate to="/flight/lobby" replace />;

	const { step } = match.params;

	return (
		<Modal
			isOpen={true}
			setIsOpen={() => {
				navigate("/");
			}}
			title="Start Flight"
		>
			<div className="pt-4">
				<Outlet />
			</div>
			<div className="flex justify-end mt-4 gap-4">
				{step !== "ship" && (
					<Link className="btn btn-warning" to="ship">
						Prev
					</Link>
				)}
				{step === "ship" && (
					<Button
						className="btn-info"
						onClick={() => dispatch({ type: "addShip" })}
					>
						Add Player Ship
					</Button>
				)}
				{step !== "mission" && (
					<Link
						className={`btn btn-primary ${
							step === "ship" && (!state.ships || state.ships.length === 0)
								? "btn-disabled"
								: ""
						}`}
						to="mission"
					>
						Next
					</Link>
				)}
				{step === "mission" && (
					<Button
						className="btn-success"
						disabled={flightStart.isPending}
						onClick={async () => {
							const {
								ships,
								flightName,
								missionId,
								hasFlightDirector,
								startingPointId: startingPoint,
								mode,
							} = state;

							if (ships.length === 0) {
								toast({
									title: "Ship is required",
									body: "You have at least one ship to start a flight.",
									color: "warning",
									action: () => navigate("ship"),
								});
								return;
							}
							const mappedShips = ships.map((ship) => ({
								...ship,
								shipName: ship.name,
								shipTemplate: ship.shipId,
								bridge: ship.bridgeId,
							}));
							flightStart.mutate({
								flightName,
								ships: mappedShips as unknown as [(typeof mappedShips)[0]],
								hasFlightDirector,
								missionId,
								startingPoint,
								mode,
							});
						}}
					>
						{flightStart.isPending ? "Starting Flight..." : "Start"}
					</Button>
				)}
			</div>
		</Modal>
	);
}
