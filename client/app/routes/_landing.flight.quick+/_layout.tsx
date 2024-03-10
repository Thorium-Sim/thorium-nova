import { randomNameGenerator } from "@server/utils/randomNameGenerator";
import { Outlet } from "@remix-run/react";
import { useNavigate, useMatch, Link } from "@remix-run/react";
import { q } from "@client/context/AppContext";
import Modal from "@thorium/ui/Modal";
import { capitalCase } from "change-case";
import Button from "@thorium/ui/Button";
import { toast } from "@client/context/ToastContext";
import { useFlightQuickStart } from "../_landing.flight";
import { Navigate } from "@client/components/Navigate";

export default function FlightQuickStart() {
	const [flight] = q.flight.active.useNetRequest();
	const [client] = q.client.get.useNetRequest();
	const flightStart = q.flight.start.useNetSend();

	const [state] = useFlightQuickStart();

	const navigate = useNavigate();

	const match = useMatch("/flight/quick/:step");

	if (!match) return <Navigate to="/flight/quick/crew" replace />;
	if (flight) return <Navigate to="/flight/lobby" replace />;
	if (!client.isHost) return <Navigate to="/" replace />;

	const { step } = match.params;

	return (
		<Modal
			isOpen={true}
			setIsOpen={() => {
				navigate("/");
			}}
			title={capitalCase(step || "Quick Start")}
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
						disabled={flightStart.isPending}
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
							await flightStart.mutate({
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
						}}
					>
						{flightStart.isPending ? "Starting Flight..." : "Start"}
					</Button>
				)}
			</div>
		</Modal>
	);
}
