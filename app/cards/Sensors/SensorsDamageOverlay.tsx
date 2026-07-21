import { DamageText } from "@thorium/components/DamageOverlay";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useState } from "react";

export function SensorsDamageOverlay({ gridOffline }: { gridOffline: boolean }) {
	const { shipId } = useStation();

	const [{ name }] = q.sensors.get.useNetRequest({
		shipId,
	});

	return (
		<DamageText
			systemName={name}
			reason="Insufficient Power"
			disabled={gridOffline}
			className="rounded-full"
		/>
	);
}

export function useSensorGridOffline() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	q.sensors.stream.useDataStream({ systemId: null, shipId });

	const [{ id, requiredPower }] = q.sensors.get.useNetRequest({
		shipId,
	});
	const [gridOffline, setGridOffline] = useState(false);
	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const sensorsData = interpolate(id);
		setGridOffline(sensorsData ? sensorsData.y < requiredPower : false);
	}, cardLoaded);

	return { gridOffline };
}
