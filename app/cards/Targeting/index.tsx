import type { CardProps } from "@thorium/cards/CardProps";
import { BeamVisualization, PhaserArcs, Phasers } from "@thorium/cards/Targeting/Phasers";
import { Shields } from "@thorium/cards/Targeting/Shields";
import { Torpedoes } from "@thorium/cards/Targeting/Torpedoes";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";
import * as React from "react";

import { ObjectImage, useObjectData } from "../Navigation/ObjectDetails";
import { CircleGrid, CircleGridTiltButton, GridCanvas } from "../Pilot/CircleGrid";
import { CircleGridContacts } from "../Pilot/PilotContacts";
import { PilotZoomSlider } from "../Pilot/PilotZoomSlider";
import { CircleGridStoreProvider } from "../Pilot/useCircleGridStore";
/**
 * TODO:
 * Add overlays to the targeting grid showing where the torpedo will fire from
 * Add explosions to the Viewscreen, and maybe even the targeting grid.
 */
export function Targeting({ cardLoaded }: CardProps) {
	const { shipId, ship } = useStation();
	const setTarget = q.targeting.setTarget.useNetSend();
	const [targetedContact] = q.targeting.targetedContact.useNetRequest({
		shipId,
	});
	q.targeting.stream.useDataStream({ shipId });
	q.pilot.stream.useDataStream({ shipId, systemId: ship.currentSystem });
	const [hull] = q.targeting.hull.useNetRequest({ shipId });
	const clickRef = React.useRef(false);
	return (
		<CircleGridStoreProvider zoomMax={25000}>
			<div className="grid h-full grid-cols-4 grid-rows-1 place-content-center gap-4">
				{/* Padding is protection from the bottom of the card container */}
				<div className="flex flex-col justify-between pb-4">
					<Shields />
					<div className="hull-monitor">Hull: {hull}</div>
					<Phasers />
				</div>
				<div className="targeting-radar col-span-2 aspect-square w-full self-center">
					<React.Suspense fallback={null}>
						<GridCanvas
							shouldRender={cardLoaded}
							onBackgroundClick={() => {
								if (clickRef.current === true) {
									clickRef.current = false;
									return;
								}
								if (targetedContact) {
									setTarget.mutate({ target: null, shipId });
								}
							}}
						>
							<CircleGrid fixedChildren={<PhaserArcs />}>
								<BeamVisualization />
								<CircleGridContacts
									targetedContactId={targetedContact?.id}
									onContactClick={(contact) => {
										clickRef.current = true;
										setTarget.mutate({ target: contact, shipId });
									}}
								/>
							</CircleGrid>
						</GridCanvas>
					</React.Suspense>
				</div>
				<div className="flex h-full flex-col gap-2 overflow-y-hidden">
					<Torpedoes />
					<div className={cn("panel", targetedContact ? "panel-error" : "panel-primary")}>
						{targetedContact?.id ? (
							<React.Suspense fallback={<h3 className="px-2 text-2xl">Accessing...</h3>}>
								<ObjectData objectId={targetedContact.id} />
							</React.Suspense>
						) : (
							<h3 className="p-2 text-center text-2xl">No Object Targeted</h3>
						)}
					</div>
					<div>
						<PilotZoomSlider />
						<CircleGridTiltButton />
					</div>
				</div>
			</div>
		</CircleGridStoreProvider>
	);
}

function ObjectData({ objectId }: { objectId: number }) {
	const [object, distanceRef] = useObjectData(objectId);
	return object ? (
		<div className="flex items-center gap-2">
			<ObjectImage objectImage={object.image} className="border-0 border-r p-2" />

			<div>
				<h3 className="text-lg">{object.name}</h3>
				<h4>{object.classification}</h4>
				<h4 className="tabular-nums">
					<strong>Distance:</strong> <span ref={distanceRef} />
				</h4>
			</div>
		</div>
	) : (
		<h3 className="px-2 text-2xl">Unidentified</h3>
	);
}
