import { InterstellarMap } from "@thorium/components/Starmap/InterstellarMap";
import SystemMarker from "@thorium/components/Starmap/SystemMarker";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { q } from "@thorium/context/AppContext";
import { computeNetworkColors } from "@thorium/routes/config/starmap/starmapUtils";
import { useMemo } from "react";
import { href, useNavigate, useParams } from "react-router";

export default function InterstellarWrapper({
	draggable = true,
	onDoubleClick,
	children,
}: {
	draggable?: boolean;
	onDoubleClick?: (systemId: string) => void;
	children?: React.ReactNode;
}) {
	const { pluginId } = useParams() as {
		pluginId: string;
	};

	const navigate = useNavigate();
	const useStarmapStore = useGetStarmapStore();

	const [stars] = q.plugin.starmap.all.useNetRequest({ pluginId });
	const networkColors = useMemo(() => computeNetworkColors(stars), [stars]);
	return (
		<InterstellarMap>
			{stars.map((star) => (
				<SystemMarker
					key={star.name}
					systemId={star.name}
					position={Object.values(star.position) as [number, number, number]}
					name={star.name}
					commSatelliteRadius={star.commSatelliteRadius || null}
					commSatelliteColor={networkColors.get(star.name) ?? null}
					draggable={draggable}
					onPointerDown={() => {
						useStarmapStore.setState({ selectedObjectIds: [star.name] });
					}}
					onDoubleClick={() =>
						navigate(
							href("/config/:pluginId/starmap/:systemId", {
								pluginId,
								systemId: star.name,
							}),
						)
					}
				/>
			))}
			{children}
		</InterstellarMap>
	);
}
