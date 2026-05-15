import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";

import { usePlayAmbiance } from "./usePlayAmbiance";

export function useAmbiance() {
	useReactorAmbiance();
	useImpulseEnginesAmbiance();
}

function useImpulseEnginesAmbiance() {
	const { shipId } = useStation();
	const [impulseEngines, { dataUpdatedAt }] = q.pilot.impulseEngines.ambiance.useNetRequest(
		{ shipId },
		{
			refetchInterval: 2000,
		},
	);
	usePlayAmbiance("impulseEngines", impulseEngines, dataUpdatedAt);
}

function useReactorAmbiance() {
	const { shipId } = useStation();
	const [reactors, { dataUpdatedAt }] = q.systemsMonitor.reactors.ambiance.useNetRequest(
		{ shipId },
		{
			refetchInterval: 2000,
		},
	);
	usePlayAmbiance("reactors", reactors, dataUpdatedAt);
}
