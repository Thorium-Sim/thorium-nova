import * as React from "react";
import Button from "@thorium/ui/Button";
import {
	CircleGrid,
	CircleGridTiltButton,
	GridCanvas,
} from "../Pilot/CircleGrid";
import type { CardProps } from "@client/routes/flight.station/CardProps";
import { CircleGridStoreProvider } from "../Pilot/useCircleGridStore";
import { PilotZoomSlider } from "../Pilot/PilotZoomSlider";
import { CircleGridContacts } from "../Pilot/PilotContacts";
import { q } from "@client/context/AppContext";

export function Targeting({ cardLoaded }: CardProps) {
	const setTarget = q.targeting.setTarget.useNetSend();
	return (
		<CircleGridStoreProvider zoomMax={25000}>
			<div className="grid grid-cols-4 h-full place-content-center gap-4">
				<div className="flex flex-col justify-between"></div>
				<div className="col-span-2 w-full aspect-square self-center">
					<React.Suspense fallback={null}>
						<GridCanvas shouldRender={cardLoaded}>
							<CircleGrid>
								<CircleGridContacts
									onContactClick={(contact) =>
										setTarget.mutate({ target: contact })
									}
								/>
							</CircleGrid>
						</GridCanvas>
					</React.Suspense>
				</div>
				<div className="h-full flex flex-col justify-between gap-2">
					<div>
						<PilotZoomSlider />
						<CircleGridTiltButton />
					</div>
				</div>
			</div>
		</CircleGridStoreProvider>
	);
}
