import { Icon } from "@thorium/ui/Icon";
import { href, Link } from "react-router";
export function WaitingForFlight() {
	return (
		<>
			<h1 className="text-center text-6xl font-bold text-white">Waiting for Flight to Start...</h1>
			<Icon name="loader-circle" className="mx-auto mt-4 animate-spin text-4xl text-white" />
			<Link
				to={href("/flight/lobby/quick/ship")}
				className="btn btn-lg btn-primary mx-auto mt-8 w-fit"
			>
				Start Flight
			</Link>
		</>
	);
}
