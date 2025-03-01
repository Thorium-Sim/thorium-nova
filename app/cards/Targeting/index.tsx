import * as React from "react";
import {
	CircleGrid,
	CircleGridTiltButton,
	GridCanvas,
} from "../Pilot/CircleGrid";

import { CircleGridStoreProvider } from "../Pilot/useCircleGridStore";
import { PilotZoomSlider } from "../Pilot/PilotZoomSlider";
import { CircleGridContacts } from "../Pilot/PilotContacts";
import { q } from "@thorium/context/AppContext";
import { ObjectImage, useObjectData } from "../Navigation/ObjectDetails";
import { cn } from "@thorium/utils/cn";
import { Shields } from "@thorium/cards/Targeting/Shields";
import {
	BeamVisualization,
	PhaserArcs,
	Phasers,
} from "@thorium/cards/Targeting/Phasers";
import { Torpedoes } from "@thorium/cards/Targeting/Torpedoes";
import type { CardProps } from "@thorium/cards/CardProps";
import { useStation } from "@thorium/routes/station/useStation";
/**
 * TODO:
 * Add overlays to the targeting grid showing where the torpedo will fire from
 * Add explosions to the Viewscreen, and maybe even the targeting grid.
 */
export function Targeting({ cardLoaded }: CardProps) {
	const { shipId } = useStation();
	const setTarget = q.targeting.setTarget.useNetSend();
	const [targetedContact] = q.targeting.targetedContact.useNetRequest({
		shipId,
	});
	q.targeting.stream.useDataStream({ shipId });
	const [hull] = q.targeting.hull.useNetRequest({ shipId });
	const clickRef = React.useRef(false);
	return (
		<CircleGridStoreProvider zoomMax={25000}>
			<div className="grid grid-cols-4 grid-rows-1 h-full place-content-center gap-4">
				{/* Padding is protection from the bottom of the card container */}
				<div className="flex flex-col justify-between pb-4">
					<Shields cardLoaded={cardLoaded} />
					<div>Hull: {hull}</div>
					<Phasers />
				</div>
				<div className="col-span-2 w-full aspect-square self-center">
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
				<div className="h-full flex flex-col gap-2 overflow-y-hidden">
					<Torpedoes />
					<div
						className={cn(
							"panel",
							targetedContact ? "panel-error" : "panel-primary",
						)}
					>
						{targetedContact?.id ? (
							<React.Suspense
								fallback={<h3 className="text-2xl">Accessing...</h3>}
							>
								<ObjectData objectId={targetedContact.id} />
							</React.Suspense>
						) : (
							<h3 className="text-2xl p-2 text-center">No Object Targeted</h3>
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
			<ObjectImage
				objectImage={object.image}
				className="border-0 border-r p-2"
			/>

			<div>
				<h3 className="text-lg">{object.name}</h3>
				<h4>{object.classification}</h4>
				<h4 className="tabular-nums">
					<strong>Distance:</strong> <span ref={distanceRef} />
				</h4>
			</div>
		</div>
	) : (
		<h3 className="text-2xl">Accessing...</h3>
	);
}
