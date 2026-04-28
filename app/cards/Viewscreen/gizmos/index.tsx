import { CollisionWarningGizmo } from "@thorium/cards/Viewscreen/gizmos/CollisionWarning";
import { NavigationGizmo } from "@thorium/cards/Viewscreen/gizmos/Navigation";
import { ObjectivesGizmo } from "@thorium/cards/Viewscreen/gizmos/Objectives";
import { ShieldsGizmo } from "@thorium/cards/Viewscreen/gizmos/Shields";
import { StardateGizmo } from "@thorium/cards/Viewscreen/gizmos/Stardate";

export function Gizmos() {
	return (
		<div className="pointer-events-none absolute h-full w-full">
			<ShieldsGizmo className="absolute top-8 left-8 w-24" />
			<ObjectivesGizmo className="absolute bottom-28 left-8" />
			<div className="absolute bottom-24 left-14 flex flex-col gap-1">
				<NavigationGizmo />
				<StardateGizmo />
			</div>
			<CollisionWarningGizmo className="absolute bottom-8 left-1/2 -translate-x-1/2" />
		</div>
	);
}
