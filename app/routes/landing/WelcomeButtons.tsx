import { NavLink } from "react-router";
import Button from "@thorium/ui/Button";
import { q, clientId } from "@thorium/context/AppContext";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

function ErrorBoundaryFallback() {
	const eb = useErrorBoundary();
	return (
		<div>
			Failed to load. <Button onClick={() => eb.resetBoundary()}>Retry</Button>
		</div>
	);
}
export const WelcomeButtons = ({ className }: { className?: string }) => {
	return (
		<div
			className={`${className} flex flex-col justify-end self-end space-y-4 max-w-md h-full`}
		>
			<ErrorBoundary fallback={<ErrorBoundaryFallback />}>
				<Suspense>
					<FlightButtons />
				</Suspense>
			</ErrorBoundary>
			<NavLink className="btn btn-success btn-outline" to="/docs">
				How-to Guides
			</NavLink>
		</div>
	);
};

function FlightButtons() {
	const [flight] = q.flight.active.useNetRequest();

	return flight ? (
		<>
			<NavLink className="btn btn-primary btn-outline" to="/flight">
				Go To Flight Lobby
			</NavLink>
			{process.env.NODE_ENV !== "production" && (
				<NavLink className="btn btn-info btn-outline" to="/cards">
					Go To Card Development
				</NavLink>
			)}
			<Button
				className="btn btn-error btn-outline"
				onClick={() => q.flight.stop.netSend()}
			>
				Stop Flight
			</Button>
		</>
	) : (
		<ClientButtons />
	);
}

function ClientButtons() {
	const [client] = q.client.get.useNetRequest({ clientId });

	return (
		<>
			<NavLink className="btn btn-primary btn-outline" to="/flight/quick/ship">
				Start Flight
			</NavLink>
			{/* <Disclosure>
			<Disclosure.Button className="btn btn-info btn-outline">
				Load a Saved Flight
			</Disclosure.Button>

			<Suspense
				fallback={
					<Disclosure.Panel
						className="text-white list-none max-h-full overflow-y-auto"
						as="ul"
					>
						<li className="list-group-item">Loading...</li>
					</Disclosure.Panel>
				}
			>
				<Flights />
			</Suspense>
		</Disclosure> */}

			{/* <Button className="btn btn-warning btn-outline">Join a Server</Button> */}
			<NavLink className="btn btn-notice btn-outline" to="/config">
				Configure Plugins
			</NavLink>

			{/* {process.env.NODE_ENV === "production" &&
	location.protocol !== "https:" && (
		<a
			className="btn btn-error btn-outline"
			href={`https://${location.hostname}:${
				Number(location.port) + 1
			}`}
		>
			Use HTTPS
		</a>
	)} */}
		</>
	);
}
