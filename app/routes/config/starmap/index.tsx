import {
	InterstellarMap,
	INTERSTELLAR_MAX_DISTANCE,
} from "@thorium/components/Starmap/InterstellarMap";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import SystemMarker from "@thorium/components/Starmap/SystemMarker";
import { q } from "@thorium/context/AppContext";
import { computeNetworkColors } from "@thorium/routes/config/starmap/starmapUtils";
import { lightYearToLightMinute } from "@thorium/utils/unitTypes";
import { useMemo } from "react";
import { href, useNavigate, useParams } from "react-router";

export default function InterstellarWrapper({
	draggable = true,
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
			{stars.map((star) =>
				Math.hypot(star.position.x, star.position.y, star.position.z) >
				lightYearToLightMinute(INTERSTELLAR_MAX_DISTANCE) ? null : (
					<SystemMarker
						key={star.name}
						systemId={star.name}
						position={
							[star.position.x, star.position.y, star.position.z] as [number, number, number]
						}
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
				),
			)}
			{children}
		</InterstellarMap>
	);
}
