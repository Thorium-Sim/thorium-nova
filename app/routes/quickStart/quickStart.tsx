import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useFlightQuickStart } from "@thorium/routes/quickStart/quickStartContext";
import Button from "@thorium/ui/Button";
import Modal from "@thorium/ui/Modal";
import { Outlet } from "react-router";
import { useNavigate, useMatch, Link } from "react-router";

export default function FlightQuickStart() {
	const [flight] = q.flight.active.useNetRequest();
	const flightStart = q.flight.start.useNetSend();

	const [state, dispatch] = useFlightQuickStart();

	const navigate = useNavigate();

	const match = useMatch("/flight/quick/:step");
	const lobbyMatch = useMatch("/flight/lobby/quick/:step");

	if (flight) return <Navigate to="/flight/lobby" replace />;

	const { step } = match ? match.params : lobbyMatch!.params;

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
			<div className="mt-4 flex justify-end gap-4">
				{step !== "ship" && (
					<Link className="btn btn-warning" to="ship">
						Prev
					</Link>
				)}
				{step === "ship" && (
					<Button
						className="btn-info"
						onClick={async () => {
							const shipId = (state.ships || []).at(-1)!.shipId;
							const shipTemplate = await q.plugin.ship.get.netRequest(shipId);
							dispatch({
								type: "addShip",
								name: (
									await q.textPattern.interpolate.netRequest({ string: shipTemplate.nameTemplate })
								).output,
							});
						}}
					>
						Add Player Ship
					</Button>
				)}
				{step !== "mission" && (
					<Link
						className={`btn btn-primary ${
							step === "ship" && (!state.ships || state.ships.length === 0) ? "btn-disabled" : ""
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
