import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { Suspense } from "react";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { NavLink } from "react-router";

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
		<div className={`${className} flex h-full max-w-md flex-col justify-end space-y-4 self-end`}>
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

	return (
		<>
			{flight ? (
				<NavLink className="btn btn-primary btn-outline" to="/flight">
					Go To Flight Lobby
				</NavLink>
			) : (
				<>
					<NavLink className="btn btn-primary btn-outline" to="/flight/quick/ship">
						Start Flight
					</NavLink>
					<NavLink
						className="btn btn-warning btn-outline"
						to="/flight/quick/ship?missionId=Training&missionPluginId=Thorium Default"
					>
						Start Training Flight
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
				</>
			)}
			<NavLink className="btn btn-notice btn-outline" to="/config">
				Configure Plugins
			</NavLink>
			{flight ? (
				<Button className="btn btn-error btn-outline" onClick={() => q.flight.stop.netSend()}>
					Stop Flight
				</Button>
			) : null}
		</>
	);
}
