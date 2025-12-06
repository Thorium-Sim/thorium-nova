import { NavigationGizmo } from "@thorium/cards/Viewscreen/gizmos/Navigation";
import { ObjectivesGizmo } from "@thorium/cards/Viewscreen/gizmos/Objectives";
import { ShieldsGizmo } from "@thorium/cards/Viewscreen/gizmos/Shields";
import { StardateGizmo } from "@thorium/cards/Viewscreen/gizmos/Stardate";

export function Gizmos() {
	return (
		<div className="pointer-events-none absolute w-full h-full">
			<StardateGizmo className="absolute bottom-20 left-8" />
			<ShieldsGizmo className="absolute top-8 left-8 w-24" />
			<ObjectivesGizmo className="absolute bottom-28 left-8" />
			<NavigationGizmo className="absolute bottom-6 left-1/2 -translate-x-1/2" />
		</div>
	);
}
